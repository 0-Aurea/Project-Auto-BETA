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

  async handleRequest(req, res) {
    const { pathname, searchParams } = new URL(req.url, 'http://example.com');
    const targetHost = searchParams.get('targetHost');
    if (!targetHost) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const targetReq = await this.createTargetRequest(req, targetHost);
    if (!targetReq) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }

    const targetRes = await this.forwardRequest(targetReq);
    if (!targetRes) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }

    this.rewriteResponseHeaders(res, targetRes.headers);
    res.writeHead(targetRes.statusCode, targetRes.headers);
    targetRes.pipe(res);
  }

  async createTargetRequest(req, targetHost) {
    const targetReq = {
      method: req.method,
      headers: req.headers,
      url: `http://${targetHost}${req.url}`,
    };

    return new Promise((resolve, reject) => {
      const targetReqSocket = require('https').request(targetReq, (targetRes) => {
        resolve(targetReqSocket);
      });
      targetReqSocket.on('error', (error) => {
        console.error('Error creating target request:', error);
        reject(error);
      });
      targetReqSocket.end();
    });
  }

  async forwardRequest(targetReq) {
    return new Promise((resolve, reject) => {
      const targetReqSocket = require('https').request(targetReq, (targetRes) => {
        resolve(targetRes);
      });
      targetReqSocket.on('error', (error) => {
        console.error('Error forwarding request:', error);
        reject(error);
      });
    });
  }

  rewriteResponseHeaders(res, headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    }
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

  start() {
    const port = 8080;
    this.server.listen(port, () => {
      console.log(`Proxy engine listening on port ${port}`);
    });
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();