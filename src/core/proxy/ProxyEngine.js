import { EncodingUtils } from '../utils/encodingUtils.js';
import { URL_PREFIX, DEFAULT_ENCODING, SALT_LENGTH, cache, rotatingSalt, wss, server, app } from '../config/constants.js';
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
import { JSRewriter } from './rewriters/JSRewriter.js';
import { HTMLRewriter } from './rewriters/HTMLRewriter.js';
import { CSSRewriter } from './rewriters/CSSRewriter.js';

const pipeline = promisify(require('stream').pipeline);

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
    this.htmlRewriter = new HTMLRewriter();
    this.cssRewriter = new CSSRewriter();
    this.rtcPeerConnections = new Map();
    this.proxyHistory = new ProxyHistory();
    this.tabs = new Map();

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

    // Serve static files for the frontend
    app.use('/_nexus', express.static('frontend'));

    // Handle search requests
    app.get('/_nexus/search', async (req, res) => {
      await this.handleSearchRequest(req, res);
    });

    // Handle new tab requests
    app.get('/_nexus/newtab', async (req, res) => {
      await this.handleNewTabRequest(req, res);
    });

    // Handle tab update requests
    app.post('/_nexus/tabupdate', async (req, res) => {
      await this.handleTabUpdateRequest(req, res);
    });

    // Handle tab removal requests
    app.post('/_nexus/tabremove', async (req, res) => {
      await this.handleTabRemoveRequest(req, res);
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

    // Check if the request is a search request
    if (reqUrl.startsWith('/_nexus/search')) {
      await this.handleSearchRequest(req, res);
      return;
    }

    // Decode the URL
    let decodedUrl = this.decodeUrl(reqUrl);

    // Check if the request is for a proxied resource
    if (decodedUrl.startsWith(URL_PREFIX)) {
      // Handle proxied resource request
      await this.handleProxiedResourceRequest(req, res, decodedUrl);
    } else {
      // Handle direct request
      await this.handleDirectRequest(req, res, decodedUrl);
    }
  }

  /**
   * Decodes a URL using the XOR + base64 encoding scheme.
   * @param {string} encodedUrl - The encoded URL.
   * @returns {string} The decoded URL.
   */
  decodeUrl(encodedUrl) {
    // Remove the URL prefix
    encodedUrl = encodedUrl.replace(URL_PREFIX, '');

    // Decode the URL
    return EncodingUtils.decode(encodedUrl, rotatingSalt);
  }

  /**
   * Handles a proxied resource request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {string} decodedUrl - The decoded URL.
   */
  async handleProxiedResourceRequest(req, res, decodedUrl) {
    // Rewrite the request headers
    req.headers['host'] = url.parse(decodedUrl).host;

    // Proxy the request
    const proxiedReq = axios.create({
      headers: req.headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Pipe the response
    const response = await proxiedReq.get(decodedUrl, {
      responseType: 'stream',
    });

    // Re-write the response headers
    res.set(response.headers);

    // Pipe the response stream
    await pipeline(response.data, res);

    // Cache the response
    this.cache.set(decodedUrl, response.data);
  }

  /**
   * Handles a direct request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {string} decodedUrl - The decoded URL.
   */
  async handleDirectRequest(req, res, decodedUrl) {
    // Check if the request is cached
    if (this.cache.has(decodedUrl)) {
      // Return the cached response
      const cachedResponse = this.cache.get(decodedUrl);
      res.set(cachedResponse.headers);
      res.send(cachedResponse);
    } else {
      // Proxy the request
      const proxiedReq = axios.create({
        headers: req.headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      // Pipe the response
      const response = await proxiedReq.get(decodedUrl, {
        responseType: 'stream',
      });

      // Re-write the response headers
      res.set(response.headers);

      // Pipe the response stream
      await pipeline(response.data, res);

      // Cache the response
      this.cache.set(decodedUrl, response.data);
    }
  }

  /**
   * Handles a WebSocket connection.
   * @param {object} req - The incoming request object.
   * @param {object} socket - The WebSocket socket object.
   * @param {object} head - The WebSocket head object.
   */
  handleWebSocket(req, socket, head) {
    // Handle WebSocket upgrade
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }

  /**
   * Handles a WebSocket connection event.
   * @param {object} ws - The WebSocket object.
   * @param {object} req - The incoming request object.
   */
  handleWebSocketConnection(ws, req) {
    // Handle WebSocket messages
    ws.on('message', (message) => {
      // Handle WebSocket message
      console.log(`Received WebSocket message: ${message}`);
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`WebSocket error: ${error}`);
    });

    // Handle WebSocket close
    ws.on('close', () => {
      console.log('WebSocket closed');
    });
  }

  /**
   * Handles a WebRTC ICE candidate scrubbing request.
   * @param {object} req - The incoming request object.
   * @param {object} socket - The socket object.
   * @param {object} head - The head object.
   */
  handleWebRTC(req, socket, head) {
    // Handle WebRTC ICE candidate scrubbing
    console.log('Handling WebRTC ICE candidate scrubbing');
  }

  /**
   * Handles a search request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleSearchRequest(req, res) {
    // Handle search request
    console.log('Handling search request');
    res.send('Search results');
  }

  /**
   * Handles a new tab request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleNewTabRequest(req, res) {
    // Handle new tab request
    console.log('Handling new tab request');
    res.send('New tab created');
  }

  /**
   * Handles a tab update request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleTabUpdateRequest(req, res) {
    // Handle tab update request
    console.log('Handling tab update request');
    res.send('Tab updated');
  }

  /**
   * Handles a tab removal request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleTabRemoveRequest(req, res) {
    // Handle tab removal request
    console.log('Handling tab removal request');
    res.send('Tab removed');
  }
}

export { ProxyEngine };