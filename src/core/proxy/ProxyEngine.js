import { URL } from 'url';
import { EncodingUtils } from '../utils/encodingUtils.js';
import { HTMLRewriter } from '../utils/htmlRewriter.js';
import { WebSocket } from 'ws';
import LRU from 'lru-cache';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

class ProxyEngine {
  /**
   * Creates a new ProxyEngine instance.
   */
  constructor() {
    this.cache = new LRU({
      max: 1000,
      maxAge: 1000 * 60 * 60 // 1 hour
    });
    this.encodingUtils = new EncodingUtils();
    this.htmlRewriter = new HTMLRewriter();
  }

  /**
   * Handles an incoming request and returns a proxied response.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the response is sent.
   */
  async handleRequest(req, res) {
    const { url: requestUrl, headers, method } = req;

    // Check if the request is for a WebSocket upgrade
    if (headers['upgrade'] === 'websocket') {
      return this.handleWebSocket(req, res);
    }

    // Determine the target URL
    let targetUrl = this.getTargetUrl(requestUrl);

    // Rewrite the request headers
    const rewrittenHeaders = this.rewriteRequestHeaders(headers);

    // Send the request to the target server
    const targetResponse = await this.sendRequestToTargetServer(targetUrl, rewrittenHeaders, method, req.body);

    // Rewrite the response headers
    const rewrittenResponseHeaders = this.rewriteResponseHeaders(targetResponse.headers);

    // Cache the response
    this.cache.set(requestUrl, targetResponse);

    // Send the response to the client
    res.writeHead(targetResponse.statusCode, rewrittenResponseHeaders);
    res.end(targetResponse.body);
  }

  /**
   * Handles a WebSocket upgrade request.
   * @param {object} req - The incoming request object.
   * @param {object} res - The outgoing response object.
   * @returns {Promise<void>} A promise that resolves when the WebSocket connection is established.
   */
  async handleWebSocket(req, res) {
    const { url: requestUrl, headers } = req;

    // Determine the target URL
    let targetUrl = this.getTargetUrl(requestUrl);

    // Establish a WebSocket connection to the target server
    const targetWebSocket = new WebSocket(targetUrl);

    // Handle WebSocket messages
    targetWebSocket.on('message', (message) => {
      req.ws.send(message);
    });

    // Handle WebSocket errors
    targetWebSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Handle WebSocket close
    targetWebSocket.on('close', () => {
      req.ws.close();
    });

    // Handle client WebSocket messages
    req.ws.on('message', (message) => {
      targetWebSocket.send(message);
    });

    // Handle client WebSocket errors
    req.ws.on('error', (error) => {
      console.error('Client WebSocket error:', error);
    });

    // Handle client WebSocket close
    req.ws.on('close', () => {
      targetWebSocket.close();
    });

    // Send the WebSocket upgrade response to the client
    res.writeHead(101, {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
      'Sec-WebSocket-Accept': headers['sec-webSocket-accept']
    });
    res.end();
  }

  /**
   * Determines the target URL for a given request URL.
   * @param {string} requestUrl - The incoming request URL.
   * @returns {string} The target URL.
   */
  getTargetUrl(requestUrl) {
    // Remove the URL prefix
    requestUrl = requestUrl.replace(/^\/_nexus/, '');

    // Decode the URL
    requestUrl = this.encodingUtils.decodeUrl(requestUrl);

    return requestUrl;
  }

  /**
   * Rewrites the request headers.
   * @param {object} headers - The incoming request headers.
   * @returns {object} The rewritten request headers.
   */
  rewriteRequestHeaders(headers) {
    // Remove sensitive headers
    delete headers['authorization'];
    delete headers['cookie'];

    // Add a new Host header
    headers['host'] = new URL(headers['origin']).hostname;

    return headers;
  }

  /**
   * Sends a request to the target server.
   * @param {string} targetUrl - The target URL.
   * @param {object} headers - The request headers.
   * @param {string} method - The request method.
   * @param {string} body - The request body.
   * @returns {Promise<object>} A promise that resolves with the response object.
   */
  async sendRequestToTargetServer(targetUrl, headers, method, body) {
    const response = await axios({
      method,
      url: targetUrl,
      headers,
      data: body
    });

    return response;
  }

  /**
   * Rewrites the response headers.
   * @param {object} headers - The incoming response headers.
   * @returns {object} The rewritten response headers.
   */
  rewriteResponseHeaders(headers) {
    // Remove sensitive headers
    delete headers['set-cookie'];

    // Add a new Cache-Control header
    headers['cache-control'] = 'max-age=60';

    return headers;
  }

  /**
   * Caches a response.
   * @param {string} requestUrl - The request URL.
   * @param {object} response - The response object.
   */
  cacheResponse(requestUrl, response) {
    this.cache.set(requestUrl, response);
  }

  /**
   * Handles a cache hit.
   * @param {string} requestUrl - The request URL.
   * @returns {object} The cached response object.
   */
  handleCacheHit(requestUrl) {
    return this.cache.get(requestUrl);
  }

  /**
   * Rewrites HTML content.
   * @param {string} html - The HTML content.
   * @returns {string} The rewritten HTML content.
   */
  rewriteHtml(html) {
    return this.htmlRewriter.rewrite(html);
  }
}

export { ProxyEngine };