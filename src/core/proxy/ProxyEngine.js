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
    if (decodedUrl.startsWith('http')) {
      // Proxy the request
      await this.proxyRequest(req, res, decodedUrl);
    } else {
      // Handle static file requests
      res.status(404).send('Not Found');
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
   * Proxies a request to the target URL.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @param {string} targetUrl - The target URL.
   */
  async proxyRequest(req, res, targetUrl) {
    try {
      // Create a new Axios request
      const axiosReq = axios({
        method: req.method,
        url: targetUrl,
        headers: req.headers,
        data: req.body,
      });

      // Handle the response
      const axiosRes = await axiosReq;
      res.set(axiosRes.headers);
      res.status(axiosRes.status);
      res.send(axiosRes.data);
    } catch (error) {
      // Handle errors
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Handles WebSocket upgrades.
   * @param {object} req - The incoming request object.
   * @param {object} socket - The WebSocket socket object.
   * @param {object} head - The WebSocket head object.
   */
  handleWebSocket(req, socket, head) {
    // Handle WebSocket upgrades
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  }

  /**
   * Handles WebSocket connections.
   * @param {object} ws - The WebSocket object.
   * @param {object} req - The incoming request object.
   */
  handleWebSocketConnection(ws, req) {
    // Handle WebSocket messages
    ws.on('message', (message) => {
      console.log(`Received WebSocket message: ${message}`);
    });

    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`WebSocket error: ${error}`);
    });

    // Handle WebSocket closures
    ws.on('close', () => {
      console.log('WebSocket closed');
    });
  }

  /**
   * Handles WebRTC ICE candidate scrubbing.
   * @param {object} req - The incoming request object.
   * @param {object} socket - The WebRTC socket object.
   * @param {object} head - The WebRTC head object.
   */
  handleWebRTC(req, socket, head) {
    // Handle WebRTC ICE candidate scrubbing
    const rtcPeerConnection = this.rtcPeerConnections.get(req.id);
    if (rtcPeerConnection) {
      // Scrub the ICE candidate
      const scrubbedCandidate = this.scrubIceCandidate(req, rtcPeerConnection);
      socket.write(scrubbedCandidate);
    } else {
      // Handle errors
      console.error('WebRTC peer connection not found');
      socket.destroy();
    }
  }

  /**
   * Scrubs a WebRTC ICE candidate.
   * @param {object} req - The incoming request object.
   * @param {object} rtcPeerConnection - The WebRTC peer connection object.
   * @returns {string} The scrubbed ICE candidate.
   */
  scrubIceCandidate(req, rtcPeerConnection) {
    // TO DO: implement ICE candidate scrubbing
  }

  /**
   * Handles search requests.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleSearchRequest(req, res) {
    // TO DO: implement search request handling
  }

  /**
   * Handles new tab requests.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleNewTabRequest(req, res) {
    // TO DO: implement new tab request handling
  }

  /**
   * Handles tab update requests.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleTabUpdateRequest(req, res) {
    // TO DO: implement tab update request handling
  }

  /**
   * Handles tab removal requests.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   */
  async handleTabRemoveRequest(req, res) {
    // TO DO: implement tab removal request handling
  }
}

export { ProxyEngine };