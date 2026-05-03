const WebSocket = require('ws');
const { createServer } = require('http');
const { URL } = require('url');

class ProxyEngine {
  constructor() {
    this.wss = new WebSocket.Server({ noServer: true });
    this.clients = new Map();
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
    });
  }

  async connectToTarget(targetHost) {
    const targetSocket = new WebSocket(targetHost);
    targetSocket.on('error', (error) => {
      console.error('Error connecting to target:', error);
    });
    await new Promise((resolve, reject) => {
      targetSocket.on('open', resolve);
      targetSocket.on('error', reject);
    });
    return targetSocket;
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

  async handleRequest(req, res) {
    if (req.headers['upgrade'] === 'websocket') {
      await this.handleUpgrade(req, req.socket, req.headers['sec-websocket-key']);
      return;
    }

    const { pathname, searchParams } = new URL(req.url, 'http://example.com');
    const targetHost = searchParams.get('targetHost');
    if (!targetHost) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const targetReq = {
      method: req.method,
      headers: this.rewriteHeaders(req.headers),
      url: `${targetHost}${pathname}`,
    };

    const targetRes = await this.forwardRequest(targetReq);
    if (targetRes) {
      res.writeHead(targetRes.statusCode, targetRes.headers);
      res.end(targetRes.body);
    } else {
      res.writeHead(502);
      res.end('Bad Gateway');
    }
  }

  async forwardRequest(req) {
    const targetHost = new URL(req.url).origin;
    const targetReq = {
      method: req.method,
      headers: req.headers,
      body: req.body,
    };

    const response = await fetch(targetHost, {
      method: targetReq.method,
      headers: targetReq.headers,
      body: targetReq.body,
    });

    return {
      statusCode: response.status,
      headers: response.headers.raw(),
      body: await response.arrayBuffer(),
    };
  }
}

module.exports = ProxyEngine;