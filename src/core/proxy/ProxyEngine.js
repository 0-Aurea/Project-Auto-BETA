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
    const websocketKey = headers['sec-websocket-key'];
    const websocketAccept = headers['sec-websocket-accept'];

    // Generate a random WebSocket ID
    const websocketId = uuidv4();

    // Create a new WebSocket client
    const wsClient = new WebSocket(`ws://${req.headers.host}${reqUrl}`);

    // Handle WebSocket connection open
    wsClient.on('open', () => {
      // Send the WebSocket connection open event
      wsClient.send(JSON.stringify({ type: 'connection_open', data: reqUrl }));

      // Store the WebSocket client in the map
      this.wsClients.set(websocketId, wsClient);
    });

    // Handle WebSocket message
    wsClient.on('message', (message) => {
      // Handle incoming WebSocket message
      const data = JSON.parse(message);

      // Scrub WebRTC ICE candidate
      if (data.type === 'ice_candidate') {
        data.sdpMLineIndex = 0;
        data.sdpMid = '';
      }

      // Send the WebSocket message to the client
      res.send(JSON.stringify(data));
    });

    // Handle WebSocket error
    wsClient.on('error', (error) => {
      console.error(error);
    });

    // Handle WebSocket close
    wsClient.on('close', () => {
      // Remove the WebSocket client from the map
      this.wsClients.delete(websocketId);
    });

    // Handle WebSocket upgrade response
    res.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': websocketAccept,
    });

    res.end();
  }

  /**
   * Rewrites the request URL.
   * @param {string} reqUrl - The incoming request URL.
   * @returns {string} The rewritten URL.
   */
  rewriteUrl(reqUrl) {
    // Remove the URL prefix
    const urlWithoutPrefix = reqUrl.replace(URL_PREFIX, '');

    // Decode the URL
    const decodedUrl = EncodingUtils.decodeUrl(urlWithoutPrefix);

    return decodedUrl;
  }

  /**
   * Rewrites the request headers.
   * @param {object} headers - The incoming request headers.
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
   * Scrubs WebRTC ICE candidate to prevent IP leaks.
   * @param {object} data - The WebSocket message data.
   */
  scrubWebrtcIceCandidate(data) {
    if (data.type === 'ice_candidate') {
      data.sdpMLineIndex = 0;
      data.sdpMid = '';
    }
  }
}

export { ProxyEngine };