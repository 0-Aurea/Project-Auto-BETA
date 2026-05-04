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

    // Handle WebSocket connections
    jsCode = jsCode.replace(/new WebSocket\(['"]([^'"]+)['"]\)/g, (match, wsUrl) => {
      return `new WebSocket('${this.rewriteUrl(wsUrl, url)}')`;
    });

    // Handle document.domain mutations
    jsCode = jsCode.replace(/document\.domain\s*=\s*['"]([^'"]+)['"]/g, (match, domain) => {
      return `document.domain = '${domain}';`;
    });

    // Handle window.location
    jsCode = jsCode.replace(/window\.location\s*=\s*['"]([^'"]+)['"]/g, (match, location) => {
      return `window.location = '${this.rewriteUrl(location, url)}';`;
    });

    // Handle window.open
    jsCode = jsCode.replace(/window\.open\(['"]([^'"]+)['"]\)/g, (match, openUrl) => {
      return `window.open('${this.rewriteUrl(openUrl, url)}')`;
    });

    // Handle history.pushState and history.replaceState
    jsCode = jsCode.replace(/history\.pushState\(/g, (match) => {
      return `history.pushState(${this.rewriteHistoryState(match)}, null, '${this.rewriteUrl(window.location.href, url)}');`;
    });

    jsCode = jsCode.replace(/history\.replaceState\(/g, (match) => {
      return `history.replaceState(${this.rewriteHistoryState(match)}, null, '${this.rewriteUrl(window.location.href, url)}');`;
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

  /**
   * Rewrites history state to prevent code injection.
   * @param {string} state - The history state to rewrite.
   * @returns {string} The rewritten history state.
   */
  rewriteHistoryState(state) {
    return state.replace(/'/g, '\\\'').replace(/"/g, '\\"');
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

    // Check if the request is cached
    if (this.cache.has(decodedUrl)) {
      const cachedResponse = this.cache.get(decodedUrl);
      res.writeHead(cachedResponse.status, cachedResponse.headers);
      res.end(cachedResponse.body);
      return;
    }

    try {
      // Forward the request to the target server
      const targetResponse = await axios({
        method,
        url: decodedUrl,
        headers: this.rewriteHeaders(headers),
        data: req.body,
      });

      // Cache the response
      this.cache.set(decodedUrl, targetResponse);

      // Rewrite the response headers
      const rewrittenHeaders = this.rewriteHeaders(targetResponse.headers);

      // Send the response
      res.writeHead(targetResponse.status, rewrittenHeaders);
      res.end(targetResponse.data);
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  /**
   * Handles a direct request and returns a response.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleDirectRequest(req, res) {
    try {
      // Forward the request to the target server
      const targetResponse = await axios({
        method: req.method,
        url: req.url,
        headers: req.headers,
        data: req.body,
      });

      // Send the response
      res.writeHead(targetResponse.status, targetResponse.headers);
      res.end(targetResponse.data);
    } catch (error) {
      console.error(error);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  /**
   * Handles a WebSocket upgrade request and establishes a WebSocket connection.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the WebSocket connection is established.
   */
  async handleWebSocketRequest(req, res) {
    const { url: reqUrl, headers } = req;

    // Decode the URL
    const decodedUrl = this.decodeUrl(reqUrl);

    // Establish a WebSocket connection to the target server
    const targetWs = new WebSocket(decodedUrl);

    // Handle WebSocket messages
    targetWs.on('message', (message) => {
      this.wsClients.get(reqUrl).send(message);
    });

    // Handle WebSocket errors
    targetWs.on('error', (error) => {
      console.error(error);
      this.wsClients.get(reqUrl).close();
    });

    // Handle WebSocket close
    targetWs.on('close', () => {
      this.wsClients.delete(reqUrl);
    });

    // Handle WebSocket upgrade response
    res.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': headers['sec-webSocket-accept'],
    });

    // Establish a WebSocket connection to the client
    const clientWs = new WebSocket(reqUrl);
    this.wsClients.set(reqUrl, clientWs);

    // Handle client WebSocket messages
    clientWs.on('message', (message) => {
      targetWs.send(message);
    });

    // Handle client WebSocket errors
    clientWs.on('error', (error) => {
      console.error(error);
      targetWs.close();
    });

    // Handle client WebSocket close
    clientWs.on('close', () => {
      targetWs.close();
    });
  }

  /**
   * Decodes a URL from the proxied request.
   * @param {string} reqUrl - The URL of the proxied request.
   * @returns {string} The decoded URL.
   */
  decodeUrl(reqUrl) {
    const encodedUrl = reqUrl.substring(URL_PREFIX.length);
    const decodedUrl = EncodingUtils.decode(encodedUrl);
    return decodedUrl;
  }

  /**
   * Rewrites the headers of a response.
   * @param {object} headers - The headers to rewrite.
   * @returns {object} The rewritten headers.
   */
  rewriteHeaders(headers) {
    const rewrittenHeaders = {};

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === 'content-security-policy') {
        rewrittenHeaders[key] = value.replace(/'self'/g, '*');
      } else if (key.toLowerCase() === 'strict-transport-security') {
        rewrittenHeaders[key] = '';
      } else if (key.toLowerCase() === 'x-frame-options') {
        rewrittenHeaders[key] = '';
      } else {
        rewrittenHeaders[key] = value;
      }
    }

    return rewrittenHeaders;
  }
}

export default ProxyEngine;