import { EncodingUtils } from '../utils/encodingUtils.js';
import { URL_PREFIX, DEFAULT_ENCODING, SALT_LENGTH, cache, rotatingSalt, wss, server } from '../config/constants.js';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import axios from 'axios';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import LRU from 'lru-cache';
import crypto from 'crypto';
import tls from 'tls';

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
    this.cache = new LRU({
      max: 1000,
      maxAge: 1000 * 60 * 60 // 1 hour
    });
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

      // Remove hop-by-hop headers
      delete rewrittenHeaders['connection'];
      delete rewrittenHeaders['keep-alive'];
      delete rewrittenHeaders['proxy-authenticate'];
      delete rewrittenHeaders['proxy-authorization'];
      delete rewrittenHeaders['te'];
      delete rewrittenHeaders['trailers'];
      delete rewrittenHeaders['upgrade'];

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
      this.wsClients.delete(reqUrl);
    });

    // Store the WebSocket client
    this.wsClients.set(reqUrl, wsClient);

    // Send the WebSocket response
    res.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': this.getWebSocketAccept(headers['sec-webSocket-key']),
    });
    res.end();
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

    // Remove hop-by-hop headers
    delete rewrittenHeaders['connection'];
    delete rewrittenHeaders['keep-alive'];
    delete rewrittenHeaders['proxy-authenticate'];
    delete rewrittenHeaders['proxy-authorization'];
    delete rewrittenHeaders['te'];
    delete rewrittenHeaders['trailers'];
    delete rewrittenHeaders['upgrade'];

    // Rewrite the Host header
    rewrittenHeaders['host'] = rewrittenHeaders['host'].replace(':', '');

    return rewrittenHeaders;
  }

  /**
   * Rewrites the WebSocket message.
   * @param {string} message - The original message.
   * @returns {string} The rewritten message.
   */
  rewriteWebSocketMessage(message) {
    // Implement WebSocket message rewriting logic here
    return message;
  }

  /**
   * Returns the WebSocket accept header value.
   * @param {string} key - The WebSocket key.
   * @returns {string} The WebSocket accept header value.
   */
  getWebSocketAccept(key) {
    return crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  }

  /**
   * Integrated HTTPS tunnel.
   */
  async handleHttpsTunnel(req, res) {
    const { headers, url: reqUrl } = req;
    const { host, referer } = headers;

    // Create a new TLS tunnel
    const tlsSocket = tls.connect({
      host: host,
      port: 443,
      rejectUnauthorized: false,
    }, () => {
      // Send the HTTPS request
      const httpsReq = {
        method: req.method,
        headers: this.rewriteHeaders(headers),
        url: `https://${host}${reqUrl}`,
      };

      // Pipe the request and response streams
      const tlsReq = axios({
        method: httpsReq.method,
        url: httpsReq.url,
        headers: httpsReq.headers,
        data: req.body,
        responseType: 'stream',
      });

      pipeline(tlsReq, res).catch((error) => {
        console.error(error);
      });
    });

    // Handle TLS errors
    tlsSocket.on('error', (error) => {
      console.error(error);
    });
  }
}

export { ProxyEngine };