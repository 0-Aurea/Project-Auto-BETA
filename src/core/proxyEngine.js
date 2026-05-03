const WebSocket = require('ws');
const { createServer } = require('http');
const { URL } = require('url');
const crypto = require('crypto');
const zlib = require('zlib');

class ProxyEngine {
  constructor() {
    this.wss = new WebSocket.Server({ noServer: true });
    this.clients = new Map();
    this.salt = crypto.randomBytes(16);
    this.saltIndex = 0;
    this.server = createServer((req, res) => {
      this.handleRequest(req, res).catch((error) => {
        console.error('Error handling request:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      });
    });
    this.server.on('upgrade', (req, socket, head) => {
      this.handleUpgrade(req, socket, head).catch((error) => {
        console.error('Error handling upgrade:', error);
        socket.destroy();
      });
    });
  }

  async handleUpgrade(req, socket, head) {
    const { pathname, searchParams } = new URL(req.url, 'http://example.com');
    const targetHost = searchParams.get('targetHost');
    if (!targetHost) {
      socket.destroy();
      return;
    }

    const targetSocket = await this.connectToTarget(targetHost);
    if (!targetSocket) {
      socket.destroy();
      return;
    }

    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit('connection', ws, req);

      const clientId = crypto.randomBytes(16).toString('hex');
      this.clients.set(clientId, { ws, targetSocket });

      ws.on('message', (message) => {
        this.handleClientMessage(clientId, message);
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      targetSocket.on('message', (message) => {
        this.handleTargetMessage(clientId, message);
      });

      targetSocket.on('close', () => {
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error('Error occurred on client WebSocket:', error);
      });

      targetSocket.on('error', (error) => {
        console.error('Error occurred on target WebSocket:', error);
      });
    });
  }

  async connectToTarget(targetHost) {
    return new Promise((resolve, reject) => {
      const targetSocket = new WebSocket(targetHost);
      targetSocket.on('error', (error) => {
        console.error('Error connecting to target:', error);
        reject(error);
      });
      targetSocket.on('open', () => {
        resolve(targetSocket);
      });
    });
  }

  handleClientMessage(clientId, message) {
    const { targetSocket } = this.clients.get(clientId);
    if (targetSocket) {
      targetSocket.send(message);
    }
  }

  handleTargetMessage(clientId, message) {
    const { ws } = this.clients.get(clientId);
    if (ws) {
      ws.send(message);
    }
  }

  rewriteHeaders(headers) {
    const rewrittenHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== 'sec-websocket-protocol') {
        rewrittenHeaders[key] = value;
      }
    }
    return rewrittenHeaders;
  }

  rotateSalt() {
    this.saltIndex++;
    if (this.saltIndex > 100) {
      this.salt = crypto.randomBytes(16);
      this.saltIndex = 0;
    }
    return this.salt;
  }

  encodeUrl(url) {
    const salt = this.rotateSalt();
    const encodedUrl = Buffer.from(url).toString('base64');
    const xorBuffer = Buffer.alloc(salt.length + encodedUrl.length);
    for (let i = 0; i < salt.length; i++) {
      xorBuffer[i] = salt[i];
    }
    for (let i = 0; i < encodedUrl.length; i++) {
      xorBuffer[salt.length + i] = encodedUrl[i] ^ salt[i % salt.length];
    }
    return xorBuffer.toString('base64');
  }

  decodeUrl(encodedUrl) {
    const buffer = Buffer.from(encodedUrl, 'base64');
    const salt = buffer.slice(0, 16);
    const encodedBuffer = buffer.slice(16);
    const decodedBuffer = Buffer.alloc(encodedBuffer.length);
    for (let i = 0; i < encodedBuffer.length; i++) {
      decodedBuffer[i] = encodedBuffer[i] ^ salt[i % salt.length];
    }
    return decodedBuffer.toString();
  }

  handleRequest(req, res) {
    const { pathname } = new URL(req.url, 'http://example.com');
    const targetUrl = this.decodeUrl(pathname.slice(1));
    const targetReq = {
      method: req.method,
      headers: this.rewriteHeaders(req.headers),
      url: targetUrl,
    };
    const targetRes = {
      on: (event, callback) => {
        if (event === 'data') {
          callback(Buffer.alloc(0));
        }
      },
    };

    const protocol = req.headers['sec-websocket-protocol'];
    if (protocol) {
      targetReq.headers['sec-websocket-protocol'] = protocol;
    }

    const reqBody = [];
    req.on('data', (chunk) => {
      reqBody.push(chunk);
    });
    req.on('end', () => {
      const body = Buffer.concat(reqBody);
      const options = {
        method: targetReq.method,
        headers: targetReq.headers,
        url: targetReq.url,
      };

      const targetSocket = require('https').request(options, (targetRes) => {
        res.writeHead(targetRes.statusCode, targetRes.headers);
        targetRes.on('data', (chunk) => {
          res.write(chunk);
        });
        targetRes.on('end', () => {
          res.end();
        });
      });

      targetSocket.on('error', (error) => {
        console.error('Error occurred on target request:', error);
      });

      targetSocket.write(body);
      targetSocket.end();
    });
  }
}

module.exports = ProxyEngine;