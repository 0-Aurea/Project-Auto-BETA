const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const { URL } = require('url');

class ProxyEngine {
  constructor() {
    this.salt = crypto.randomBytes(16);
    this.saltRotationInterval = 60000; // 1 minute
    this.encodedSalt = this.base64Encode(this.salt);
    this.app = express();
    this.wss = new WebSocket.Server({ noServer: true });

    setInterval(() => {
      this.rotateSalt();
    }, this.saltRotationInterval);
  }

  rotateSalt() {
    this.salt = crypto.randomBytes(16);
    this.encodedSalt = this.base64Encode(this.salt);
  }

  base64Encode(data) {
    return Buffer.from(data).toString('base64');
  }

  base64Decode(data) {
    return Buffer.from(data, 'base64');
  }

  xorEncode(data, salt) {
    const encodedData = [];
    for (let i = 0; i < data.length; i++) {
      encodedData.push(data[i] ^ salt[i % salt.length]);
    }
    return Buffer.from(encodedData);
  }

  xorDecode(data, salt) {
    return this.xorEncode(data, salt);
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, 'http://example.com');
    const path = url.pathname;
    const encodedPath = this.encodePath(path, this.salt);

    req.url = `/${encodedPath}`;
    req.headers['x-nexus-salt'] = this.encodedSalt;

    const targetHost = 'https://' + url.host;
    const targetReq = {
      method: req.method,
      headers: req.headers,
      url: targetHost + path,
    };

    const targetRes = await this.forwardRequest(targetReq, req.body);

    const responseHeaders = {
      ...targetRes.headers,
      'content-security-policy': '',
      'strict-transport-security': '',
      'x-frame-options': '',
    };

    res.writeHead(targetRes.statusCode, responseHeaders);
    res.end(targetRes.body);
  }

  async forwardRequest(req, body) {
    return new Promise((resolve, reject) => {
      const options = {
        method: req.method,
        headers: req.headers,
        url: req.url,
      };

      const targetReq = require('https').request(options, (targetRes) => {
        let body = '';
        targetRes.on('data', (chunk) => {
          body += chunk;
        });

        targetRes.on('end', () => {
          resolve({
            statusCode: targetRes.statusCode,
            headers: targetRes.headers,
            body,
          });
        });
      });

      targetReq.on('error', (err) => {
        reject(err);
      });

      targetReq.write(body);
      targetReq.end();
    });
  }

  handleWebSocket(req, socket, head) {
    const url = new URL(req.url, 'http://example.com');
    const path = url.pathname;
    const encodedPath = this.encodePath(path, this.salt);

    req.url = `/${encodedPath}`;

    const targetHost = 'wss://' + url.host;
    const targetReq = {
      method: req.method,
      headers: req.headers,
      url: targetHost + path,
    };

    const wss = new WebSocket(targetHost + path, {
      headers: targetReq.headers,
    });

    wss.on('open', () => {
      socket.pipe(wss);
      wss.pipe(socket);
    });

    wss.on('error', (err) => {
      console.error(err);
    });

    socket.on('error', (err) => {
      console.error(err);
    });
  }

  encodePath(path, salt) {
    const encodedPath = this.xorEncode(Buffer.from(path), salt);
    return this.base64Encode(encodedPath);
  }

  decodePath(encodedPath) {
    const decodedPath = this.base64Decode(encodedPath);
    return this.xorDecode(decodedPath, this.salt).toString();
  }

  init() {
    this.app.use((req, res, next) => {
      if (req.url.startsWith('/')) {
        this.handleRequest(req, res);
      } else {
        next();
      }
    });

    this.app.get('/.well-known/nexus-salt', (req, res) => {
      res.set("Content-Type", "text/plain");
      res.send(this.encodedSalt);
    });

    this.wss.on('connection', (ws, req) => {
      this.handleWebSocket(req, ws._socket, ws._socket);
    });

    return this.app;
  }
}

module.exports = ProxyEngine;