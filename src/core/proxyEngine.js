const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const { URL } = require('url');

class ProxyEngine {
  constructor() {
    this.salt = crypto.randomBytes(16);
    this.app = express();
    this.wss = new WebSocket.Server({ noServer: true });
    this.cookies = {};
  }

  start() {
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    this.app.use((req, res, next) => {
      if (req.url.startsWith('/')) {
        const encodedUrl = req.url.substring(1);
        const decodedUrl = this.decodeUrl(encodedUrl);
        req.url = decodedUrl;
        next();
      } else {
        next();
      }
    });

    this.app.get('*', (req, res) => {
      this.handleGetRequest(req, res);
    });

    this.app.post('*', (req, res) => {
      this.handlePostRequest(req, res);
    });

    this.wss.on('connection', (ws, req) => {
      this.handleWebSocketConnection(ws, req);
    });

    this.app.use((req, res) => {
      res.status(404).send('Not Found');
    });
  }

  decodeUrl(encodedUrl) {
    const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.salt, this.salt);
    return decipher.update(decodedUrl, 'utf8', 'utf8') + decipher.final('utf8');
  }

  async handleGetRequest(req, res) {
    const url = new URL(req.url, 'http://example.com');
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key !== 'host') {
        headers[key] = value;
      }
    }

    try {
      const response = await this.fetch(url.href, {
        method: req.method,
        headers,
      });

      for (const [key, value] of Object.entries(response.headers)) {
        if (key !== 'set-cookie') {
          res.header(key, value);
        }
      }

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        for (const cookie of cookies) {
          const match = cookie.match(/^([^=]+)=([^;]+)/);
          if (match) {
            const cookieName = match[1].trim();
            const cookieValue = match[2].trim();
            this.cookies[url.origin] = this.cookies[url.origin] || {};
            this.cookies[url.origin][cookieName] = cookieValue;
          }
        }
      }

      res.status(response.status).send(await response.text());
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }

  async handlePostRequest(req, res) {
    const url = new URL(req.url, 'http://example.com');
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key !== 'host') {
        headers[key] = value;
      }
    }

    try {
      const response = await this.fetch(url.href, {
        method: req.method,
        headers,
        body: req.body,
      });

      for (const [key, value] of Object.entries(response.headers)) {
        if (key !== 'set-cookie') {
          res.header(key, value);
        }
      }

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        for (const cookie of cookies) {
          const match = cookie.match(/^([^=]+)=([^;]+)/);
          if (match) {
            const cookieName = match[1].trim();
            const cookieValue = match[2].trim();
            this.cookies[url.origin] = this.cookies[url.origin] || {};
            this.cookies[url.origin][cookieName] = cookieValue;
          }
        }
      }

      res.status(response.status).send(await response.text());
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }

  handleWebSocketConnection(ws, req) {
    const url = new URL(req.url, 'http://example.com');
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (key !== 'host') {
        headers[key] = value;
      }
    }

    const wss = new WebSocket(url.href, {
      headers,
    });

    ws.on('message', (message) => {
      wss.send(message);
    });

    wss.on('message', (message) => {
      ws.send(message);
    });

    wss.on('error', (error) => {
      console.error(error);
    });

    ws.on('error', (error) => {
      console.error(error);
    });

    ws.on('close', () => {
      wss.close();
    });

    wss.on('close', () => {
      ws.close();
    });
  }

  async fetch(url, options) {
    const response = await import('node-fetch').then(({default: fetch}) => fetch(url, options));
    return response;
  }

  scrubWebRTCIceCandidates(response) {
    const regex = /candidate:([^\s]+)/g;
    return response.text().then((text) => text.replace(regex, (match, candidate) => {
      return `candidate:XXXX`;
    }));
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();

const server = require('http').createServer(proxyEngine.app);
server.listen(8080, () => {
  console.log('Proxy server listening on port 8080');
});

server.on('upgrade', (req, socket, head) => {
  proxyEngine.wss.handleUpgrade(req, socket, head, (ws) => {
    proxyEngine.wss.emit('connection', ws, req);
  });
});