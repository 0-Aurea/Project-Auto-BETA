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

  async handleRequest(req, res) {
    if (req.headers['upgrade'] === 'websocket') {
      return;
    }

    const { pathname, searchParams } = new URL(req.url, 'http://example.com');
    const targetHost = searchParams.get('targetHost');
    if (!targetHost) {
      res.writeHead(400);
      res.end('Bad Request');
      return;
    }

    const encodedPathname = this.encodePathname(pathname);
    const targetReq = {
      method: req.method,
      headers: this.rewriteHeaders(req.headers),
      url: `${targetHost}${encodedPathname}`,
    };

    const targetRes = await this.forwardRequest(targetReq);
    const responseHeaders = targetRes.headers;
    const statusCode = targetRes.statusCode;

    res.writeHead(statusCode, responseHeaders);
    targetRes.on('data', (chunk) => {
      res.write(chunk);
    });
    targetRes.on('end', () => {
      res.end();
    });
  }

  async forwardRequest(req) {
    return new Promise((resolve, reject) => {
      const options = {
        method: req.method,
        headers: req.headers,
        hostname: new URL(req.url).hostname,
        port: 80,
        path: req.url,
      };

      const targetReq = require('https').request(options, (res) => {
        resolve(res);
      });

      targetReq.on('error', (error) => {
        reject(error);
      });

      targetReq.end();
    });
  }

  encodePathname(pathname) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.salt, iv);
    const encrypted = Buffer.concat([cipher.update(pathname), cipher.final()]);
    const encoded = iv.toString('base64') + ':' + encrypted.toString('base64');
    return encoded;
  }

  start() {
    this.server.listen(8080, () => {
      console.log('Proxy server listening on port 8080');
    });
  }

  stop() {
    this.server.close();
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();

async function handleWebRTCIceCandidate(candidate) {
  // TO DO: implement WebRTC ICE candidate handling
}

async function handleWebSocketUpgrade(req, socket, head) {
  // TO DO: implement WebSocket upgrade handling
}