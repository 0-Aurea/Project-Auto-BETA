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
import { ProxyHistory } from './ProxyHistory.js';

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
    this.jsRewriter = new JSRewriter();
    this.rtcPeerConnections = new Map();
    this.proxyHistory = new ProxyHistory();

    // Initialize WebSocket server event listeners
    wss.on('connection', (ws, req) => {
      this.handleWebSocketConnection(ws, req);
    });

    // Initialize WebRTC peer connection handling
    server.on('upgrade', (req, socket, head) => {
      if (req.headers['upgrade'] === 'websocket') {
        this.handleWebSocket(req, socket, head);
      } else {
        // Handle WebRTC ICE candidate scrubbing
        this.handleWebRTC(req, socket, head);
      }
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
      this.proxyHistory.addEntry(req, cachedResponse);
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

      // Rewrite the response content
      let rewrittenContent = response.data;
      if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
        rewrittenContent = this.jsRewriter.rewriteHtml(rewrittenContent, rewrittenUrl);
      }

      // Cache the response
      const cacheEntry = {
        status: response.status,
        headers: rewrittenHeaders,
        data: rewrittenContent,
      };
      this.cache.set(rewrittenUrl, cacheEntry);

      // Send the response
      res.writeHead(response.status, rewrittenHeaders);
      res.end(rewrittenContent);

      // Add entry to proxy history
      this.proxyHistory.addEntry(req, cacheEntry);
    } catch (error) {
      console.error('Error proxying request:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }

  /**
   * Handles WebSocket upgrades.
   * @param {object} req - The incoming request object.
   * @param {object} socket - The WebSocket socket object.
   * @param {object} head - The WebSocket upgrade head object.
   */
  handleWebSocket(req, socket, head) {
    const { headers, url: reqUrl } = req;

    // Rewrite the request URL
    const rewrittenUrl = this.rewriteUrl(reqUrl);

    // Handle WebSocket upgrade
    const ws = new WebSocket(rewrittenUrl, {
      headers: this.rewriteHeaders(headers),
    });

    // Handle WebSocket messages
    ws.on('message', (message) => {
      this.handleWebSocketMessage(message, req, socket);
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle WebSocket close
    ws.on('close', () => {
      this.handleWebSocketClose(req, socket);
    });

    // Add WebSocket client to map
    this.wsClients.set(reqUrl, ws);
  }

  /**
   * Handles WebSocket messages.
   * @param {string} message - The WebSocket message.
   * @param {object} req - The incoming request object.
   * @param {object} socket - The WebSocket socket object.
   */
  handleWebSocketMessage(message, req, socket) {
    const { headers, url: reqUrl } = req;

    // Rewrite the WebSocket message
    const rewrittenMessage = this.jsRewriter.rewriteWebSocketMessage(message, reqUrl);

    // Send the rewritten message to the WebSocket client
    this.wsClients.get(reqUrl).send(rewrittenMessage);
  }

  /**
   * Handles WebSocket close.
   * @param {object} req - The incoming request object.
   * @param {object} socket - The WebSocket socket object.
   */
  handleWebSocketClose(req, socket) {
    const { url: reqUrl } = req;

    // Remove WebSocket client from map
    this.wsClients.delete(reqUrl);
  }

  /**
   * Rewrites the request URL.
   * @param {string} reqUrl - The incoming request URL.
   * @returns {string} The rewritten URL.
   */
  rewriteUrl(reqUrl) {
    // Implement URL rewriting logic here
    return reqUrl;
  }

  /**
   * Rewrites the request headers.
   * @param {object} headers - The incoming request headers.
   * @returns {object} The rewritten headers.
   */
  rewriteHeaders(headers) {
    // Implement header rewriting logic here
    return headers;
  }
}

export { ProxyEngine };