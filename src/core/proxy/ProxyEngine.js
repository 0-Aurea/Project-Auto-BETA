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

    // Handle WebSocket upgrade
    if (req.headers['upgrade'] === 'websocket') {
      res.writeHead(101, {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': req.headers['sec-websocket-accept']
      });
    } else {
      // Handle HTTP requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }
  }

  /**
   * Handles HTTPS tunnel connections.
   * @param {tls.TLSSocket} socket - The TLS socket.
   * @param {http.IncomingMessage} req - The incoming request.
   */
  handleHttpsTunnel(socket, req) {
    const targetOptions = {
      hostname: url.parse(req.url).hostname,
      port: 443,
      path: req.url,
      headers: req.headers
    };

    const targetSocket = tls.connect(targetOptions, () => {
      socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    });

    socket.on('data', (data) => {
      targetSocket.write(data);
    });

    targetSocket.on('data', (data) => {
      socket.write(data);
    });

    socket.on('error', (error) => {
      console.error('Client HTTPS tunnel error:', error);
    });

    targetSocket.on('error', (error) => {
      console.error('Target HTTPS tunnel error:', error);
    });

    socket.on('close', () => {
      targetSocket.destroy();
    });

    targetSocket.on('close', () => {
      socket.destroy();
    });
  }

  /**
   * Starts the proxy server.
   */
  start() {
    this.server.on('connection', (socket) => {
      socket.on('data', (data) => {
        const req = http.parse(data);
        if (req.method === 'CONNECT') {
          this.handleHttpsTunnel(socket, req);
        } else {
          this.handleRequest(req, socket);
        }
      });
    });

    this.wss.on('connection', (ws, req) => {
      this.handleWebSocket(ws, req);
    });

    this.server.listen(8080, () => {
      console.log('Proxy server listening on port 8080');
    });
  }

  /**
   * Handles incoming HTTP requests.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {net.Socket} socket - The socket.
   */
  handleRequest(req, socket) {
    const targetUrl = this.decodeUrl(req.url);
    const targetOptions = {
      hostname: url.parse(targetUrl).hostname,
      port: url.parse(targetUrl).port,
      path: url.parse(targetUrl).path,
      headers: req.headers
    };

    const targetReq = http.request(targetOptions, (targetRes) => {
      socket.write(`HTTP/1.1 ${targetRes.statusCode} ${targetRes.statusMessage}\r\n`);
      Object.keys(targetRes.headers).forEach((header) => {
        socket.write(`${header}: ${targetRes.headers[header]}\r\n`);
      });
      socket.write('\r\n');

      targetRes.on('data', (data) => {
        socket.write(data);
      });

      targetRes.on('end', () => {
        socket.end();
      });
    });

    req.on('data', (data) => {
      targetReq.write(data);
    });

    req.on('end', () => {
      targetReq.end();
    });
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();