const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const LRU = require('lru-cache');
const crypto = require('crypto');
const tls = require('tls');
const fs = require('fs');
const { EncodingUtils } = require('../utils/encodingUtils');
const { URL_PREFIX, DEFAULT_ENCODING } = require('../config/constants');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cache = new LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60 // 1 hour
});

class ProxyEngine {
  /**
   * Creates a new ProxyEngine instance.
   */
  constructor() {
    this.app = app;
    this.server = server;
    this.wss = wss;
    this.cache = cache;
  }

  /**
   * Generates an encoded URL using XOR + base64 encoding with a rotating salt.
   * @param {http.IncomingMessage} req - The incoming request.
   * @returns {string} The encoded URL.
   */
  generateEncodedUrl(req) {
    const salt = EncodingUtils.getSalt().toString('hex');
    const xorEncodedUrl = this.xorEncode(req.url, salt);
    const base64EncodedUrl = Buffer.from(xorEncodedUrl).toString('base64');
    return `/${URL_PREFIX}/${DEFAULT_ENCODING}/${salt}/${base64EncodedUrl}`;
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
    if (urlParts.length < 5 || urlParts[1] !== URL_PREFIX) {
      throw new Error('Invalid encoded URL');
    }

    const encoding = urlParts[2];
    const salt = urlParts[3];
    const base64EncodedUrl = urlParts.slice(4).join('/');
    const xorEncodedUrl = Buffer.from(base64EncodedUrl, 'base64').toString();
    const decodedUrl = this.xorDecode(xorEncodedUrl, salt);

    return decodedUrl;
  }

  /**
   * XOR decodes a URL with a given salt.
   * @param {string} xorEncodedUrl - The XOR encoded URL.
   * @param {string} salt - The salt to use for decoding.
   * @returns {string} The decoded URL.
   */
  xorDecode(xorEncodedUrl, salt) {
    const xorBuffer = Buffer.from(xorEncodedUrl);
    const saltBuffer = Buffer.from(salt, 'hex');
    const decodedBuffer = Buffer.alloc(xorBuffer.length);

    for (let i = 0; i < xorBuffer.length; i++) {
      decodedBuffer[i] = xorBuffer[i] ^ saltBuffer[i % saltBuffer.length];
    }

    return decodedBuffer.toString();
  }

  /**
   * Sets up the integrated HTTPS tunnel.
   */
  setupHttpsTunnel() {
    const options = {
      key: fs.readFileSync('path/to/tls/key'),
      cert: fs.readFileSync('path/to/tls/cert')
    };

    const httpsServer = https.createServer(options, (req, res) => {
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
    });

    httpsServer.listen(443, () => {
      console.log('Integrated HTTPS tunnel listening on port 443');
    });
  }

  /**
   * Starts the proxy engine.
   */
  start() {
    this.app.use((req, res) => {
      if (req.url.startsWith(`/${URL_PREFIX}`)) {
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
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
    });

    this.wss.on('connection', (ws, req) => {
      this.handleWebSocket(ws, req);
    });

    this.server.listen(8080, () => {
      console.log('Proxy engine listening on port 8080');
    });

    this.setupHttpsTunnel();
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();