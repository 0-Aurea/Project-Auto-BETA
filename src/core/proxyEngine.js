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

    const encodedPathname = this.encodePathname(pathname);
    const targetReq = {
      method: req.method,
      headers: this.rewriteHeaders(req.headers),
      url: `${targetHost}${encodedPathname}`,
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

  encodePathname(pathname) {
    const buffer = Buffer.from(pathname, 'utf8');
    const xorBuffer = this.xorBuffer(buffer, this.salt);
    const base64Encoded = xorBuffer.toString('base64');
    this.salt = crypto.randomBytes(16);
    return base64Encoded;
  }

  xorBuffer(buffer, key) {
    const xorBuffer = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      xorBuffer[i] = buffer[i] ^ key[i % key.length];
    }
    return xorBuffer;
  }

  async forwardRequest(req) {
    const targetHost = req.url.split('://')?.[1]?.split('/')[0];
    if (!targetHost) return null;

    const options = {
      method: req.method,
      headers: req.headers,
      hostname: targetHost,
      port: 80,
      path: req.url,
    };

    return new Promise((resolve, reject) => {
      const targetReq = require('http').request(options, (targetRes) => {
        let body = '';
        targetRes.on('data', (chunk) => {
          body += chunk;
        });
        targetRes.on('end', () => {
          const decompressedBody = this.decompressBody(body, targetRes.headers['content-encoding']);
          resolve({
            statusCode: targetRes.statusCode,
            headers: targetRes.headers,
            body: decompressedBody,
          });
        });
      });

      targetReq.on('error', (error) => {
        reject(error);
      });

      targetReq.end();
    });
  }

  decompressBody(body, encoding) {
    switch (encoding) {
      case 'gzip':
        return zlib.gunzipSync(Buffer.from(body)).toString();
      case 'br':
        return zlib.brotliDecompressSync(Buffer.from(body)).toString();
      default:
        return body;
    }
  }

  startServer() {
    const server = createServer((req, res) => {
      this.handleRequest(req, res).catch((error) => {
        console.error(error);
        res.writeHead(500);
        res.end('Internal Server Error');
      });
    });

    server.listen(8080, () => {
      console.log('Proxy server listening on port 8080');
    });

    this.wss.on('connection', (ws) => {
      console.log('Client connected');
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.startServer();