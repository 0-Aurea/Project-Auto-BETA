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
    this.cache = new Map();
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

    // Check if the request is cached
    if (this.cache.has(rewrittenUrl)) {
      const cachedResponse = this.cache.get(rewrittenUrl);
      res.writeHead(cachedResponse.status, cachedResponse.headers);
      res.end(cachedResponse.data);
      return;
    }

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

      // Cache the response
      this.cache.set(rewrittenUrl, {
        status: response.status,
        headers: rewrittenHeaders,
        data: response.data,
      });

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
      if (wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(rewrittenMessage);
      }
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

    // Handle WebSocket open
    wsClient.on('open', () => {
      // Send the WebSocket upgrade response
      res.writeHead(101, {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      });
      res.end();
    });

    // Add the WebSocket client to the map
    this.wsClients.set(reqUrl, wsClient);
  }

  /**
   * Rewrites the request URL.
   * @param {string} url - The original URL.
   * @returns {string} The rewritten URL.
   */
  rewriteUrl(url) {
    // XOR + base64 URL encoding with a rotating salt
    const salt = EncodingUtils.getSalt();
    const encodedUrl = EncodingUtils.encode(url, salt);
    return `${URL_PREFIX}/${encodedUrl}`;
  }

  /**
   * Rewrites the request headers.
   * @param {object} headers - The original headers.
   * @returns {object} The rewritten headers.
   */
  rewriteHeaders(headers) {
    const rewrittenHeaders = { ...headers };

    // Strip CSP, HSTS, X-Frame-Options
    delete rewrittenHeaders['content-security-policy'];
    delete rewrittenHeaders['strict-transport-security'];
    delete rewrittenHeaders['x-frame-options'];

    // Rewrite Cookie header to isolate cookies per proxied origin
    if (rewrittenHeaders.cookie) {
      rewrittenHeaders.cookie = rewrittenHeaders.cookie.split(';').map((cookie) => {
        const [key, value] = cookie.trim().split('=');
        return `${key}=${value}`;
      }).join(';');
    }

    return rewrittenHeaders;
  }

  /**
   * Rewrites the WebSocket message.
   * @param {string} message - The original message.
   * @returns {string} The rewritten message.
   */
  rewriteWebSocketMessage(message) {
    // TO DO: implement WebSocket message rewriting
    return message;
  }

  /**
   * Handles dynamic import rewriting.
   * @param {string} importStatement - The original import statement.
   * @returns {string} The rewritten import statement.
   */
  rewriteDynamicImport(importStatement) {
    // Use a regex to match the import statement
    const importRegex = /import\((['"])(.*?)\1\)/g;
    return importStatement.replace(importRegex, (match, quote, url) => {
      const rewrittenUrl = this.rewriteUrl(url);
      return `import(${quote}${rewrittenUrl}${quote})`;
    });
  }

  /**
   * Handles eval() rewriting.
   * @param {string} evalStatement - The original eval statement.
   * @returns {string} The rewritten eval statement.
   */
  rewriteEval(evalStatement) {
    // Use a regex to match the eval statement
    const evalRegex = /eval\((['"])(.*?)\1\)/g;
    return evalStatement.replace(evalRegex, (match, quote, code) => {
      // TO DO: implement eval rewriting
      return match;
    });
  }
}

export default ProxyEngine;