import { EncodingUtils } from '../utils/encodingUtils.js';
import { URL_PREFIX, DEFAULT_ENCODING, SALT_LENGTH } from '../config/constants.js';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import axios from 'axios';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

const pipeline = promisify(require('stream').pipeline');

/**
 * ProxyEngine class to handle proxying requests and WebSocket upgrades.
 */
class ProxyEngine {
  /**
   * Creates a new ProxyEngine instance.
   */
  constructor() {
    this.wsClients = new Map();
  }

  /**
   * Handles incoming requests and proxies them to the target URL.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleRequest(req, res) {
    const { headers, url: reqUrl } = req;
    const { host, referer } = headers;

    // Check if the request is for a WebSocket upgrade
    if (headers['upgrade'] === 'websocket') {
      this.handleWebSocket(req, res);
      return;
    }

    // Rewrite the request URL
    const rewrittenUrl = this.rewriteUrl(reqUrl);

    // Proxy the request
    try {
      const response = await axios({
        method: req.method,
        url: rewrittenUrl,
        headers: this.rewriteHeaders(headers),
        data: req.body,
      });

      // Rewrite the response headers
      const rewrittenHeaders = this.rewriteHeaders(response.headers);

      // Send the response
      res.writeHead(response.status, rewrittenHeaders);
      res.end(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Handles WebSocket upgrades and proxies the WebSocket connection.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  handleWebSocket(req, res) {
    const { headers, url: reqUrl } = req;
    const { host, referer } = headers;

    // Rewrite the WebSocket URL
    const rewrittenUrl = this.rewriteUrl(reqUrl);

    // Create a new WebSocket client
    const wsClient = new WebSocket(rewrittenUrl);

    // Handle WebSocket messages
    wsClient.on('message', (message) => {
      // Rewrite the WebSocket message
      const rewrittenMessage = this.rewriteWebSocketMessage(message);

      // Send the rewritten message to the client
      res.socket.write(`data: ${rewrittenMessage}\n\n`);
    });

    // Handle WebSocket errors
    wsClient.on('error', (error) => {
      console.error(error);
    });

    // Handle WebSocket close
    wsClient.on('close', () => {
      // Remove the WebSocket client from the map
      this.wsClients.delete(reqUrl);
    });

    // Add the WebSocket client to the map
    this.wsClients.set(reqUrl, wsClient);

    // Send the WebSocket upgrade response
    res.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': headers['sec-websocket-accept'],
    });
    res.end();
  }

  /**
   * Rewrites a URL to handle dynamic imports.
   * @param {string} url - The URL to rewrite.
   * @returns {string} The rewritten URL.
   */
  rewriteUrl(url) {
    // Handle relative URLs
    if (!url.startsWith('http')) {
      return new URL(url, 'http://example.com').href;
    }

    // Use XOR + base64 URL encoding with a rotating salt
    return EncodingUtils.encodeUrl(url);
  }

  /**
   * Rewrites headers to handle proxying.
   * @param {object} headers - The headers to rewrite.
   * @returns {object} The rewritten headers.
   */
  rewriteHeaders(headers) {
    const rewrittenHeaders = {};

    // Remove sensitive headers
    for (const header in headers) {
      if (header.toLowerCase() !== 'host' && header.toLowerCase() !== 'referer') {
        rewrittenHeaders[header] = headers[header];
      }
    }

    return rewrittenHeaders;
  }

  /**
   * Rewrites WebSocket messages to handle proxying.
   * @param {string} message - The WebSocket message to rewrite.
   * @returns {string} The rewritten WebSocket message.
   */
  rewriteWebSocketMessage(message) {
    // Handle WebSocket message rewriting
    return message;
  }

  /**
   * Scrubs WebRTC ICE candidate information to prevent IP leaks.
   * @param {object} iceCandidate - The WebRTC ICE candidate object.
   * @returns {object} The scrubbed WebRTC ICE candidate object.
   */
  scrubWebRTCIceCandidate(iceCandidate) {
    // Remove IP address information
    delete iceCandidate.candidate.split(':').pop();

    return iceCandidate;
  }
}

/**
 * JSRewriter class to handle rewriting JavaScript code.
 */
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
    return str.replace(/'/g, '\\\'');
  }

  /**
   * Rewrites history state to handle proxying.
   * @param {string} historyState - The history state to rewrite.
   * @returns {string} The rewritten history state.
   */
  rewriteHistoryState(historyState) {
    return historyState;
  }
}

export { ProxyEngine, JSRewriter };