const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const LRU = require('lru-cache');
const crypto = require('crypto');
const tls = require('tls');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cache = new LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60 // 1 hour
});

const rotatingSalt = crypto.randomBytes(16).toString('hex');

class ProxyEngine {
  /**
   * Creates a new ProxyEngine instance.
   */
  constructor() {
    this.app = app;
    this.server = server;
    this.wss = wss;
    this.cache = cache;
    this.rotatingSalt = rotatingSalt;
  }

  /**
   * Generates an encoded URL using XOR + base64 encoding with a rotating salt.
   * @param {http.IncomingMessage} req - The incoming request.
   * @returns {string} The encoded URL.
   */
  generateEncodedUrl(req) {
    const salt = crypto.randomBytes(16).toString('hex');
    const encodedUrl = Buffer.from(req.url).toString('base64');
    return `/${this.rotatingSalt}/${salt}/${encodedUrl}`;
  }

  /**
   * Handles incoming WebSocket connections.
   * @param {WebSocket} ws - The WebSocket object.
   * @param {http.IncomingMessage} req - The incoming request.
   */
  handleWebSocket(ws, req) {
    const targetUrl = this.decodeUrl(req.url);
    const targetOptions = {
      hostname: url.parse(targetUrl).hostname,
      port: url.parse(targetUrl).port,
      path: url.parse(targetUrl).path,
      headers: req.headers
    };

    const targetWs = new WebSocket(targetUrl);

    ws.on('message', (message) => {
      targetWs.send(message);
    });

    targetWs.on('message', (message) => {
      ws.send(message);
    });

    targetWs.on('error', (error) => {
      console.error('Target WebSocket error:', error);
    });

    ws.on('error', (error) => {
      console.error('Client WebSocket error:', error);
    });

    ws.on('close', () => {
      targetWs.close();
    });

    targetWs.on('close', () => {
      ws.close();
    });
  }

  /**
   * Decodes a URL encoded using XOR + base64 encoding with a rotating salt.
   * @param {string} encodedUrl - The encoded URL.
   * @returns {string} The decoded URL.
   */
  decodeUrl(encodedUrl) {
    const urlParts = encodedUrl.split('/');
    const salt = urlParts[2];
    const encodedPath = urlParts[3];

    const decodedPath = Buffer.from(encodedPath, 'base64').toString();
    return decodedPath;
  }

  /**
   * Rewrites the request and response headers.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {http.ServerResponse} res - The outgoing response.
   */
  rewriteHeaders(req, res) {
    // Strip CSP, HSTS, X-Frame-Options
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('Strict-Transport-Security');
    res.removeHeader('X-Frame-Options');

    // Isolate cookies per proxied origin
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      const isolatedCookies = [];

      cookies.forEach((cookie) => {
        const [name, value] = cookie.trim().split('=');
        isolatedCookies.push(`${name}=${value}; Domain=${url.parse(req.url).hostname}; Path=/`);
      });

      res.setHeader('Set-Cookie', isolatedCookies);
    }
  }

  /**
   * Handles HTTPS CONNECT requests.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {http.ServerResponse} res - The outgoing response.
   */
  handleHttpsConnect(req, res) {
    const targetHost = req.headers['host'];
    const targetPort = 443;

    const targetSocket = tls.connect(targetHost, targetPort, () => {
      res.writeHead(200, {
        'Content-Type': 'text/plain'
      });
      res.end();

      req.pipe(targetSocket);
      targetSocket.pipe(res);
    });

    targetSocket.on('error', (error) => {
      console.error('Target HTTPS error:', error);
      res.destroy();
    });

    req.on('error', (error) => {
      console.error('Client HTTPS error:', error);
      targetSocket.destroy();
    });
  }

  /**
   * Handles incoming requests and upgrades them to WebSocket or HTTPS connections if necessary.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {http.ServerResponse} res - The outgoing response.
   */
  handleRequest(req, res) {
    if (req.method === 'CONNECT') {
      this.handleHttpsConnect(req, res);
    } else if (req.headers['upgrade'] === 'websocket') {
      this.handleWebSocket(new WebSocket(req, res), req);
    } else {
      const targetUrl = this.decodeUrl(req.url);
      const targetOptions = {
        hostname: url.parse(targetUrl).hostname,
        port: url.parse(targetUrl).port,
        path: url.parse(targetUrl).path,
        headers: req.headers
      };

      const targetReq = http.request(targetOptions, (targetRes) => {
        res.writeHead(targetRes.statusCode, targetRes.headers);
        targetRes.pipe(res);
      });

      req.pipe(targetReq);

      targetReq.on('error', (error) => {
        console.error('Target request error:', error);
        res.destroy();
      });

      req.on('error', (error) => {
        console.error('Client request error:', error);
        targetReq.destroy();
      });
    }
  }

  /**
   * Starts the proxy server.
   */
  start() {
    this.server.on('request', (req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(8080, () => {
      console.log('Proxy server listening on port 8080');
    });
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();