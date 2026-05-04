import { EncodingUtils } from '../utils/encodingUtils.js';
import { URL_PREFIX, DEFAULT_ENCODING, SALT_LENGTH } from '../config/constants.js';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import axios from 'axios';
import WebSocket from 'ws';

const pipeline = promisify(require('stream').pipeline');

class JSRewriter {
  /**
   * Rewrites JavaScript code to handle dynamic imports and eval().
   * @param {string} jsCode - The JavaScript code to rewrite.
   * @param {string} url - The URL of the JavaScript file.
   * @returns {string} The rewritten JavaScript code.
   */
  rewrite(jsCode, url) {
    // Handle dynamic imports
    jsCode = jsCode.replace(/import\(['"]([^'"]+)['"]\)/g, (match, importUrl) => {
      return `import('${this.rewriteUrl(importUrl, url)}')`;
    });

    // Handle eval()
    jsCode = jsCode.replace(/eval\(['"]([^'"]+)['"]\)/g, (match, evalCode) => {
      return `eval('${this.escapeString(evalCode)}')`;
    });

    // Handle Function()
    jsCode = jsCode.replace(/Function\(['"]([^'"]+)['"]\)/g, (match, funcCode) => {
      return `Function('${this.escapeString(funcCode)}')`;
    });

    return jsCode;
  }

  /**
   * Rewrites a URL to handle dynamic imports.
   * @param {string} url - The URL to rewrite.
   * @param {string} baseUrl - The base URL of the JavaScript file.
   * @returns {string} The rewritten URL.
   */
  rewriteUrl(url, baseUrl) {
    // Handle relative URLs
    if (!url.startsWith('http')) {
      return new URL(url, baseUrl).href;
    }

    return url;
  }

  /**
   * Escapes a string to prevent code injection.
   * @param {string} str - The string to escape.
   * @returns {string} The escaped string.
   */
  escapeString(str) {
    return str.replace(/'/g, '\\\'').replace(/"/g, '\\"');
  }
}

class ProxyEngine {
  /**
   * Creates a new ProxyEngine instance.
   */
  constructor() {
    this.cache = new Map();
    this.wsClients = new Map();
    this.jsRewriter = new JSRewriter();
  }

  /**
   * Handles an incoming request and returns a response.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleRequest(req, res) {
    const { url: reqUrl, headers, method } = req;

    // Check if the request is for a proxied resource
    if (!reqUrl.startsWith(URL_PREFIX)) {
      return this.handleDirectRequest(req, res);
    }

    // Check if the request is a WebSocket upgrade request
    if (headers['upgrade'] === 'websocket') {
      return this.handleWebSocketRequest(req, res);
    }

    // Decode the URL
    const decodedUrl = this.decodeUrl(reqUrl);

    // Check if the decoded URL is valid
    if (!decodedUrl) {
      return this.handleError(req, res, 400, 'Invalid URL');
    }

    // Get the cached response if available
    const cachedResponse = await this.getCachedResponse(decodedUrl);
    if (cachedResponse) {
      return this.sendResponse(req, res, cachedResponse);
    }

    try {
      // Forward the request to the target server
      const targetResponse = await this.forwardRequest(decodedUrl, req);

      // Rewrite the response HTML/JS/CSS
      const rewrittenResponse = await this.rewriteResponse(targetResponse, decodedUrl);

      // Cache the response
      await this.cacheResponse(decodedUrl, rewrittenResponse);

      // Send the response
      return this.sendResponse(req, res, rewrittenResponse);
    } catch (error) {
      return this.handleError(req, res, 500, 'Internal Server Error');
    }
  }

  /**
   * Handles a WebSocket upgrade request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleWebSocketRequest(req, res) {
    const { url: reqUrl, headers, socket, upgrade } = req;

    // Decode the URL
    const decodedUrl = this.decodeUrl(reqUrl);

    // Check if the decoded URL is valid
    if (!decodedUrl) {
      return this.handleError(req, res, 400, 'Invalid URL');
    }

    // Create a new WebSocket connection to the target server
    const targetWs = new WebSocket(decodedUrl);

    // Handle the WebSocket connection
    targetWs.on('open', () => {
      // Forward the WebSocket upgrade request to the target server
      upgrade(targetWs, req, res, req.headers['sec-websocket-protocol']);
    });

    targetWs.on('message', (message) => {
      // Forward the WebSocket message to the client
      this.wsClients.get(reqUrl).send(message);
    });

    targetWs.on('close', () => {
      // Close the WebSocket connection
      this.wsClients.delete(reqUrl);
    });

    targetWs.on('error', (error) => {
      // Handle WebSocket errors
      console.error('WebSocket error:', error);
    });

    this.wsClients.set(reqUrl, targetWs);
  }

  /**
   * Decodes a URL from the request.
   * @param {string} reqUrl - The URL from the request.
   * @returns {string} The decoded URL.
   */
  decodeUrl(reqUrl) {
    // Remove the URL prefix
    const urlWithoutPrefix = reqUrl.substring(URL_PREFIX.length);

    // Decode the URL using the rotating salt
    const decodedUrl = EncodingUtils.decodeUrl(urlWithoutPrefix, EncodingUtils.getSalt());

    return decodedUrl;
  }

  /**
   * Encodes a URL for the response.
   * @param {string} url - The URL to encode.
   * @returns {string} The encoded URL.
   */
  encodeUrl(url) {
    // Encode the URL using the rotating salt
    const encodedUrl = EncodingUtils.encodeUrl(url, EncodingUtils.getSalt());

    // Add the URL prefix
    const prefixedUrl = `${URL_PREFIX}/${encodedUrl}`;

    return prefixedUrl;
  }

  /**
   * Forwards a request to the target server.
   * @param {string} decodedUrl - The decoded URL.
   * @param {object} req - The incoming request object.
   * @returns {Promise<object>} A promise that resolves with the target response.
   */
  async forwardRequest(decodedUrl, req) {
    // Create a new request to the target server
    const targetReq = axios.create({
      headers: req.headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Forward the request to the target server
    const targetResponse = await targetReq({
      method: req.method,
      url: decodedUrl,
      data: req.body,
      headers: req.headers,
    });

    return targetResponse;
  }

  /**
   * Rewrites the response HTML/JS/CSS.
   * @param {object} targetResponse - The target response.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<object>} A promise that resolves with the rewritten response.
   */
  async rewriteResponse(targetResponse, decodedUrl) {
    // Get the response HTML/JS/CSS
    let responseBody = await targetResponse.data;

    // Check if the response is HTML
    if (targetResponse.headers['content-type'].includes('text/html')) {
      // Rewrite the HTML
      responseBody = this.rewriteHtml(responseBody, decodedUrl);
    }

    // Check if the response is JavaScript
    if (targetResponse.headers['content-type'].includes('application/javascript')) {
      // Rewrite the JavaScript
      responseBody = this.jsRewriter.rewrite(responseBody, decodedUrl);
    }

    // Update the response headers
    targetResponse.headers['content-length'] = Buffer.byteLength(responseBody);

    // Return the rewritten response
    return {
      ...targetResponse,
      data: responseBody,
    };
  }

  /**
   * Rewrites the HTML response.
   * @param {string} html - The HTML response.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {string} The rewritten HTML.
   */
  rewriteHtml(html, decodedUrl) {
    // Handle HTML tags
    html = html.replace(/<script src=['"]([^'"]+)['"]>/g, (match, scriptSrc) => {
      return `<script src="${this.rewriteUrl(scriptSrc, decodedUrl)}"></script>`;
    });

    html = html.replace(/<link href=['"]([^'"]+)['"]>/g, (match, linkHref) => {
      return `<link href="${this.rewriteUrl(linkHref, decodedUrl)}">`;
    });

    return html;
  }

  /**
   * Rewrites a URL in the HTML response.
   * @param {string} url - The URL to rewrite.
   * @param {string} baseUrl - The base URL of the HTML response.
   * @returns {string} The rewritten URL.
   */
  rewriteUrl(url, baseUrl) {
    // Handle relative URLs
    if (!url.startsWith('http')) {
      return new URL(url, baseUrl).href;
    }

    return url;
  }

  /**
   * Handles a direct request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleDirectRequest(req, res) {
    // Handle the direct request
    const directResponse = await axios({
      method: req.method,
      url: req.url,
      headers: req.headers,
      data: req.body,
    });

    // Send the direct response
    res.status(directResponse.status).set(directResponse.headers).send(directResponse.data);
  }

  /**
   * Handles an error.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {number} statusCode - The error status code.
   * @param {string} errorMessage - The error message.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleError(req, res, statusCode, errorMessage) {
    // Send the error response
    res.status(statusCode).send(errorMessage);
  }

  /**
   * Gets a cached response.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<object>} A promise that resolves with the cached response.
   */
  async getCachedResponse(decodedUrl) {
    // Check if the response is cached
    if (this.cache.has(decodedUrl)) {
      return this.cache.get(decodedUrl);
    }

    return null;
  }

  /**
   * Caches a response.
   * @param {string} decodedUrl - The decoded URL.
   * @param {object} response - The response to cache.
   * @returns {Promise<void>} A promise that resolves when the response is cached.
   */
  async cacheResponse(decodedUrl, response) {
    // Cache the response
    this.cache.set(decodedUrl, response);
  }

  /**
   * Sends a response.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {object} response - The response to send.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async sendResponse(req, res, response) {
    // Send the response
    res.status(response.status).set(response.headers).send(response.data);
  }
}

export { ProxyEngine };