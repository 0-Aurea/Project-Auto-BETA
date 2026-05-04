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
    const xorEncodedUrl = this.xorEncode(req.url, salt);
    const base64EncodedUrl = Buffer.from(xorEncodedUrl).toString('base64');
    return `/${this.rotatingSalt}/${salt}/${base64EncodedUrl}`;
  }

  /**
   * XOR encodes a URL with a given salt.
   * @param {string} url - The URL to encode.
   * @param {string} salt - The salt to use for encoding.
   * @returns {string} The XOR encoded URL.
   */
  xorEncode(url, salt) {
    const urlBuffer = Buffer.from(url);
    const saltBuffer = Buffer.from(salt, 'hex');
    const encodedBuffer = Buffer.alloc(urlBuffer.length);

    for (let i = 0; i < urlBuffer.length; i++) {
      encodedBuffer[i] = urlBuffer[i] ^ saltBuffer[i % saltBuffer.length];
    }

    return encodedBuffer.toString();
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
    const base64EncodedPath = urlParts[3];

    const decodedPathBuffer = Buffer.from(base64EncodedPath, 'base64');
    const xorDecodedPath = this.xorDecode(decodedPathBuffer.toString(), salt);

    return xorDecodedPath;
  }

  /**
   * XOR decodes a URL with a given salt.
   * @param {string} encodedUrl - The XOR encoded URL.
   * @param {string} salt - The salt to use for decoding.
   * @returns {string} The decoded URL.
   */
  xorDecode(encodedUrl, salt) {
    const encodedUrlBuffer = Buffer.from(encodedUrl);
    const saltBuffer = Buffer.from(salt, 'hex');
    const decodedBuffer = Buffer.alloc(encodedUrlBuffer.length);

    for (let i = 0; i < encodedUrlBuffer.length; i++) {
      decodedBuffer[i] = encodedUrlBuffer[i] ^ saltBuffer[i % saltBuffer.length];
    }

    return decodedBuffer.toString();
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
        const [key, value] = cookie.trim().split('=');
        isolatedCookies.push(`${key}=${value}; Secure; Path=/`);
      });

      res.setHeader('Set-Cookie', isolatedCookies);
    }

    // Rewrite WebSocket upgrade requests
    if (req.headers['upgrade'] === 'websocket') {
      res.setHeader('Upgrade', 'WebSocket');
      res.setHeader('Connection', 'Upgrade');
    }

    // Handle WebRTC ICE candidate scrubbing
    if (req.headers['content-type'] === 'application/json') {
      const requestBody = req.body;
      if (requestBody && requestBody.iceCandidates) {
        requestBody.iceCandidates = requestBody.iceCandidates.map((candidate) => {
          return candidate.replace(/a=ssrc:(\d+)/g, 'a=ssrc:xxxxxx');
        });
      }
    }
  }

  /**
   * Handles HTTPS tunnel connections.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {http.ServerResponse} res - The outgoing response.
   */
  handleHttpsTunnel(req, res) {
    const targetOptions = {
      hostname: url.parse(req.url).hostname,
      port: 443,
      path: req.url,
      headers: req.headers
    };

    const targetReq = http.request(targetOptions, (targetRes) => {
      res.writeHead(targetRes.statusCode, targetRes.headers);
      targetRes.pipe(res);
    });

    req.pipe(targetReq);

    targetReq.on('error', (error) => {
      console.error('Target HTTPS error:', error);
    });
  }

  /**
   * Starts the proxy server.
   */
  start() {
    this.app.use((req, res) => {
      if (req.url.startsWith('/_nexus')) {
        this.handleRequest(req, res);
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
    });

    this.server.listen(8080, () => {
      console.log('Proxy server listening on port 8080');
    });
  }

  /**
   * Handles incoming requests.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {http.ServerResponse} res - The outgoing response.
   */
  handleRequest(req, res) {
    if (req.headers['upgrade'] === 'websocket') {
      this.handleWebSocket(req.ws, req);
    } else if (req.url.startsWith('/_nexus')) {
      this.handleHttpsTunnel(req, res);
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();