const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const { URL } = require('url');
const https = require('https');

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

    this.app.use((req, res, next) => {
      if (req.url.startsWith('/')) {
        this.handleRequest(req, res);
      } else {
        next();
      }
    });

    this.wss.on('connection', (ws, req) => {
      this.handleWebSocket(req, ws);
    });
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

  encodePath(path, salt) {
    const pathBuffer = Buffer.from(path);
    const encodedPath = this.xorEncode(pathBuffer, salt);
    return this.base64Encode(encodedPath);
  }

  decodePath(encodedPath, salt) {
    const encodedPathBuffer = this.base64Decode(encodedPath);
    return this.xorDecode(encodedPathBuffer, salt).toString();
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, 'http://example.com'); //non dynamic = bad
    const path = url.pathname;
    const encodedPath = this.encodePath(path, this.salt);

    req.headers['x-nexus-salt'] = this.encodedSalt;

    const targetHost = url.host;
    const targetReq = {
      method: req.method,
      headers: req.headers,
      url: `https://${targetHost}${path}`,
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
        hostname: new URL(req.url).hostname,
        port: 443,
        path: new URL(req.url).pathname,
      };

      const targetReq = https.request(options, (targetRes) => {
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

  handleWebSocket(req, socket) {
    const url = new URL(req.url, 'http://example.com'); // non dynamic = bad
    const path = url.pathname;

    const targetHost = url.host;
    const targetReq = {
      method: req.method,
      headers: req.headers,
      url: `wss://${targetHost}${path}`,
    };

    const wss = new WebSocket(`wss://${targetHost}${path}`, {
      headers: targetReq.headers,
    });

    wss.on('open', () => {
      socket.on('message', (message) => {
        wss.send(message);
      });

      wss.on('message', (message) => {
        socket.send(message);
      });

      wss.on('close', () => {
        socket.close();
      });

      wss.on('error', (err) => {
        socket.emit('error', err);
      });
    });

    socket.on('close', () => {
      wss.close();
    });

    socket.on('error', (err) => {
      wss.emit('error', err);
    });
  }
}

module.exports = ProxyEngine;
