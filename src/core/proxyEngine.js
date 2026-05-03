const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const { URL } = require('url');
const https = require('https');
const fs = require('fs');
const { JSDOM } = require('jsdom');
const { promisify } = require('util');
const zlib = require('zlib');
const brotli = require('iltorb');

class ProxyEngine {
  constructor() {
    this.salt = crypto.randomBytes(16);
    this.saltRotationInterval = 60000; // 1 minute
    this.encodedSalt = this.base64Encode(this.salt);
    this.app = express();
    this.wss = new WebSocket.Server({ noServer: true });
    this.httpsServer = https.createServer({
      key: fs.readFileSync('path/to/ssl/key'),
      cert: fs.readFileSync('path/to/ssl/cert'),
    }, this.app);

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
    const url = new URL(req.url, 'http://example.com');
    const path = url.pathname;
    const encodedPath = this.encodePath(path, this.salt);

    req.headers['x-nexus-salt'] = this.encodedSalt;

    const targetHost = url.host;
    const targetReq = {
      method: req.method,
      headers: req.headers,
      url: `https://${targetHost}${path}`,
    };

    if (req.body) {
      targetReq.body = req.body;
    }

    const targetRes = await this.forwardRequest(targetReq);
    const responseHeaders = {
      ...targetRes.headers,
      'content-security-policy': '',
      'strict-transport-security': '',
      'x-frame-options': '',
    };

    let responseBody = targetRes.body;
    if (targetRes.headers['content-type'] && targetRes.headers['content-type'].includes('text/html')) {
      responseBody = await this.rewriteHtml(responseBody, targetHost);
    } else if (targetRes.headers['content-type'] && targetRes.headers['content-type'].includes('application/javascript')) {
      responseBody = await this.rewriteJs(responseBody, targetHost);
    } else if (targetRes.headers['content-type'] && targetRes.headers['content-type'].includes('text/css')) {
      responseBody = await this.rewriteCss(responseBody, targetHost);
    }

    if (targetRes.headers['content-encoding'] && targetRes.headers['content-encoding'].includes('gzip')) {
      responseBody = zlib.gunzipSync(responseBody);
    } else if (targetRes.headers['content-encoding'] && targetRes.headers['content-encoding'].includes('br')) {
      responseBody = brotli.decompressSync(responseBody);
    }

    res.writeHead(targetRes.statusCode, responseHeaders);
    res.end(responseBody);
  }

  async forwardRequest(req) {
    return new Promise((resolve, reject) => {
      const targetReq = https.request(req.url, {
        method: req.method,
        headers: req.headers,
      }, (targetRes) => {
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

      if (req.body) {
        targetReq.write(req.body);
      }
      targetReq.end();
    });
  }

  async rewriteHtml(html, targetHost) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Handle HTML elements
    const scripts = document.querySelectorAll('script');
    scripts.forEach((script) => {
      if (script.src) {
        script.src = this.rewriteUrl(script.src, targetHost);
      }
      if (script.innerHTML) {
        script.innerHTML = this.rewriteJs(script.innerHTML, targetHost);
      }
    });

    const links = document.querySelectorAll('link');
    links.forEach((link) => {
      if (link.href) {
        link.href = this.rewriteUrl(link.href, targetHost);
      }
    });

    const images = document.querySelectorAll('img');
    images.forEach((image) => {
      if (image.src) {
        image.src = this.rewriteUrl(image.src, targetHost);
      }
    });

    return dom.serialize();
  }

  async rewriteJs(js, targetHost) {
    // Smarter JS rewriter: handle eval(), Function(), dynamic import(),
    // new Worker(), importScripts(), document.domain mutations,
    // window.location, window.open, history.pushState/replaceState

    // For simplicity, this example just rewrites URLs
    return js.replace(/https?:\/\/[^)]+/g, (match) => {
      return this.rewriteUrl(match, targetHost);
    });
  }

  async rewriteCss(css, targetHost) {
    // Handle CSS url(), @import, content: url(...)
    return css.replace(/url\(([^)]+)\)/g, (match, url) => {
      return `url(${this.rewriteUrl(url, targetHost)})`;
    });
  }

  rewriteUrl(url, targetHost) {
    const absoluteUrl = new URL(url, `https://${targetHost}`);
    return absoluteUrl.href;
  }

  handleWebSocket(req, ws) {
    const targetHost = req.headers['host'];
    const targetWs = new WebSocket(`wss://${targetHost}`);

    ws.on('message', (message) => {
      targetWs.send(message);
    });

    targetWs.on('message', (message) => {
      ws.send(message);
    });

    ws.on('close', () => {
      targetWs.close();
    });

    targetWs.on('close', () => {
      ws.close();
    });
  }
}

module.exports = ProxyEngine;