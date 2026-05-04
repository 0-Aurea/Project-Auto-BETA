import { EncodingUtils } from '../utils/encodingUtils.js';
import { URL_PREFIX, DEFAULT_ENCODING } from '../config/constants.js';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import axios from 'axios';
import WebSocket from 'ws';

const pipeline = promisify(require('stream').pipeline);

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
      upgrade(targetWs, req, res, (err) => {
        if (err) {
          console.error(err);
        }
      });

      // Forward messages from the client to the target server
      req.on('data', (data) => {
        targetWs.send(data);
      });

      // Forward messages from the target server to the client
      targetWs.on('message', (data) => {
        res.write(data);
      });

      // Handle errors
      targetWs.on('error', (err) => {
        console.error(err);
      });

      // Handle close
      targetWs.on('close', () => {
        res.end();
      });
    });
  }

  /**
   * Decodes a URL.
   * @param {string} encodedUrl - The encoded URL.
   * @returns {string} The decoded URL.
   */
  decodeUrl(encodedUrl) {
    const encodedPrefix = URL_PREFIX.length;
    const encodedUrlWithoutPrefix = encodedUrl.substring(encodedPrefix);
    return EncodingUtils.decode(encodedUrlWithoutPrefix);
  }

  /**
   * Forwards a request to the target server.
   * @param {string} decodedUrl - The decoded URL.
   * @param {object} req - The incoming request object.
   * @returns {Promise<object>} A promise that resolves with the target response.
   */
  async forwardRequest(decodedUrl, req) {
    const { method, headers, body } = req;
    const targetResponse = await axios({
      method,
      url: decodedUrl,
      headers,
      data: body,
    });
    return targetResponse;
  }

  /**
   * Rewrites a response.
   * @param {object} response - The response to rewrite.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<object>} A promise that resolves with the rewritten response.
   */
  async rewriteResponse(response, decodedUrl) {
    const { data, headers } = response;
    const contentType = headers['content-type'];

    if (contentType.includes('text/html')) {
      return this.rewriteHtml(data, decodedUrl);
    } else if (contentType.includes('application/javascript')) {
      return this.rewriteJs(data, decodedUrl);
    } else if (contentType.includes('text/css')) {
      return this.rewriteCss(data, decodedUrl);
    }

    return response;
  }

  /**
   * Rewrites HTML.
   * @param {string} html - The HTML to rewrite.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<string>} A promise that resolves with the rewritten HTML.
   */
  async rewriteHtml(html, decodedUrl) {
    return this.jsRewriter.rewriteHtml(html, decodedUrl);
  }

  /**
   * Rewrites JavaScript.
   * @param {string} js - The JavaScript to rewrite.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<string>} A promise that resolves with the rewritten JavaScript.
   */
  async rewriteJs(js, decodedUrl) {
    return this.jsRewriter.rewriteJs(js, decodedUrl);
  }

  /**
   * Rewrites CSS.
   * @param {string} css - The CSS to rewrite.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<string>} A promise that resolves with the rewritten CSS.
   */
  async rewriteCss(css, decodedUrl) {
    return this.jsRewriter.rewriteCss(css, decodedUrl);
  }

  /**
   * Handles a direct request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleDirectRequest(req, res) {
    // Implement direct request handling
  }

  /**
   * Handles an error.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {number} statusCode - The status code.
   * @param {string} message - The error message.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleError(req, res, statusCode, message) {
    res.status(statusCode).send(message);
  }

  /**
   * Gets a cached response.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<object>} A promise that resolves with the cached response.
   */
  async getCachedResponse(decodedUrl) {
    // Implement caching
  }

  /**
   * Caches a response.
   * @param {string} decodedUrl - The decoded URL.
   * @param {object} response - The response to cache.
   * @returns {Promise<void>} A promise that resolves when the response is cached.
   */
  async cacheResponse(decodedUrl, response) {
    // Implement caching
  }

  /**
   * Sends a response.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {object} response - The response to send.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async sendResponse(req, res, response) {
    const { status, headers, data } = response;
    res.status(status);

    Object.keys(headers).forEach((header) => {
      res.set(header, headers[header]);
    });

    res.send(data);
  }
}

class JSRewriter {
  /**
   * Rewrites HTML.
   * @param {string} html - The HTML to rewrite.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<string>} A promise that resolves with the rewritten HTML.
   */
  async rewriteHtml(html, decodedUrl) {
    // Implement HTML rewriting
    return html;
  }

  /**
   * Rewrites JavaScript.
   * @param {string} js - The JavaScript to rewrite.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<string>} A promise that resolves with the rewritten JavaScript.
   */
  async rewriteJs(js, decodedUrl) {
    // Implement JavaScript rewriting
    return js;
  }

  /**
   * Rewrites CSS.
   * @param {string} css - The CSS to rewrite.
   * @param {string} decodedUrl - The decoded URL.
   * @returns {Promise<string>} A promise that resolves with the rewritten CSS.
   */
  async rewriteCss(css, decodedUrl) {
    // Implement CSS rewriting
    return css;
  }
}

export { ProxyEngine };