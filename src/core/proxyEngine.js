const WebSocket = require('ws');
const { createServer } = require('http');
const { URL } = require('url');
const crypto = require('crypto');
const zlib = require('zlib');
const { JSDOM } = require('jsdom');

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

    const rewrittenRes = await this.rewriteResponse(targetRes);
    this.rewriteResponseHeaders(res, rewrittenRes.headers);
    res.writeHead(rewrittenRes.statusCode, rewrittenRes.headers);
    rewrittenRes.pipe(res);
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

  async rewriteResponse(targetRes) {
    const chunks = [];
    targetRes.on('data', (chunk) => {
      chunks.push(chunk);
    });
    return new Promise((resolve, reject) => {
      targetRes.on('end', () => {
        const responseBody = Buffer.concat(chunks);
        const contentType = targetRes.headers['content-type'];
        if (contentType && contentType.includes('text/html')) {
          const rewrittenBody = this.rewriteHtml(responseBody.toString());
          const rewrittenRes = {
            statusCode: targetRes.statusCode,
            headers: targetRes.headers,
            pipe: (res) => {
              res.writeHead(targetRes.statusCode, targetRes.headers);
              res.end(rewrittenBody);
            },
          };
          resolve(rewrittenRes);
        } else if (contentType && contentType.includes('application/javascript')) {
          const rewrittenBody = this.rewriteJs(responseBody.toString());
          const rewrittenRes = {
            statusCode: targetRes.statusCode,
            headers: targetRes.headers,
            pipe: (res) => {
              res.writeHead(targetRes.statusCode, targetRes.headers);
              res.end(rewrittenBody);
            },
          };
          resolve(rewrittenRes);
        } else {
          const rewrittenRes = {
            statusCode: targetRes.statusCode,
            headers: targetRes.headers,
            pipe: (res) => {
              res.writeHead(targetRes.statusCode, targetRes.headers);
              res.end(responseBody);
            },
          };
          resolve(rewrittenRes);
        }
      });
      targetRes.on('error', (error) => {
        console.error('Error rewriting response:', error);
        reject(error);
      });
    });
  }

  rewriteHtml(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Handle HTML elements
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script) => {
      const rewrittenScript = this.rewriteJs(script.textContent);
      script.textContent = rewrittenScript;
    });

    // Handle HTML attributes
    const images = document.querySelectorAll('img');
    images.forEach((image) => {
      const src = image.getAttribute('src');
      if (src) {
        image.setAttribute('src', this.rewriteUrl(src));
      }
    });

    return dom.serialize();
  }

  rewriteJs(js) {
    // Simple JS rewriting, handle eval(), Function(), etc.
    return js.replace(/eval\(/g, 'eval.call(navigator,');
  }

  rewriteUrl(url) {
    // Simple URL rewriting
    return url.replace(/^\/\//, 'https://');
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

    socket.pipe(targetSocket);
    targetSocket.pipe(socket);
  }

  async connectToTarget(targetHost) {
    return new Promise((resolve, reject) => {
      const targetSocket = require('net').connect(targetHost, (stream) => {
        resolve(stream);
      });
      targetSocket.on('error', (error) => {
        console.error('Error connecting to target:', error);
        reject(error);
      });
    });
  }
}

module.exports = ProxyEngine;