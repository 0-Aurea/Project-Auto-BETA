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

    const rewrittenRes = await this.rewriteResponse(targetRes, req);
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

  async rewriteResponse(targetRes, req) {
    const chunks = [];
    targetRes.on('data', (chunk) => {
      chunks.push(chunk);
    });
    return new Promise((resolve, reject) => {
      targetRes.on('end', async () => {
        const responseBody = Buffer.concat(chunks);
        const contentType = targetRes.headers['content-type'];
        let rewrittenBody = responseBody;

        if (contentType && contentType.includes('text/html')) {
          rewrittenBody = await this.rewriteHtml(responseBody.toString(), req);
        } else if (contentType && contentType.includes('application/javascript')) {
          rewrittenBody = await this.rewriteJavascript(responseBody.toString(), req);
        } else if (contentType && contentType.includes('text/css')) {
          rewrittenBody = await this.rewriteCss(responseBody.toString(), req);
        }

        const rewrittenRes = {
          statusCode: targetRes.statusCode,
          headers: targetRes.headers,
          pipe: (res) => {
            res.write(rewrittenBody);
            res.end();
          },
        };

        resolve(rewrittenRes);
      });
      targetRes.on('error', (error) => {
        console.error('Error rewriting response:', error);
        reject(error);
      });
    });
  }

  async rewriteHtml(html, req) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Handle HTML meta refresh
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      const content = metaRefresh.getAttribute('content');
      if (content) {
        const url = new URL(content, req.url);
        metaRefresh.setAttribute('content', url.href);
      }
    }

    // Handle HTML base tag
    const baseTag = document.querySelector('base');
    if (baseTag) {
      const href = baseTag.getAttribute('href');
      if (href) {
        const url = new URL(href, req.url);
        baseTag.setAttribute('href', url.href);
      }
    }

    // Handle HTML src/href/action/srcset/data attributes
    const tags = document.querySelectorAll('*[src],[href],[action],[srcset],[data]');
    tags.forEach((tag) => {
      Array.prototype.forEach.call(tag.attributes, (attribute) => {
        if (attribute.name === 'src' || attribute.name === 'href' || attribute.name === 'action' || attribute.name === 'srcset' || attribute.name === 'data') {
          const value = attribute.value;
          if (value) {
            const url = new URL(value, req.url);
            attribute.value = url.href;
          }
        }
      });
    });

    return dom.serialize();
  }

  async rewriteJavascript(js, req) {
    // Handle dynamic JS imports
    const importRegex = /import\(['"]([^'"]+)['"]\)/g;
    return js.replace(importRegex, (match, importUrl) => {
      const url = new URL(importUrl, req.url);
      return `import('${url.href}');`;
    });
  }

  async rewriteCss(css, req) {
    // Handle CSS url() and @import
    const urlRegex = /url\(['"]([^'"]+)['"]\)/g;
    const importRegex = /@import\s+['"]([^'"]+)['"]/g;
    return css.replace(urlRegex, (match, url) => {
      const rewrittenUrl = new URL(url, req.url).href;
      return `url('${rewrittenUrl}');`;
    }).replace(importRegex, (match, importUrl) => {
      const rewrittenUrl = new URL(importUrl, req.url).href;
      return `@import '${rewrittenUrl}';`;
    });
  }

  rewriteResponseHeaders(res, headers) {
    // Strip CSP, HSTS, X-Frame-Options
    delete headers['content-security-policy'];
    delete headers['strict-transport-security'];
    delete headers['x-frame-options'];

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  async handleUpgrade(req, socket, head) {
    const { pathname, searchParams } = new URL(req.url, 'http://example.com');
    const targetHost = searchParams.get('targetHost');
    if (!targetHost) {
      socket.destroy();
      return;
    }

    const targetWs = new WebSocket(`ws://${targetHost}${req.url}`);
    targetWs.on('open', () => {
      this.wss.emit('connection', targetWs, req, socket, head);
    });
    targetWs.on('message', (message) => {
      socket.send(message);
    });
    socket.on('message', (message) => {
      targetWs.send(message);
    });
    targetWs.on('error', (error) => {
      console.error('Error handling WebSocket upgrade:', error);
      socket.destroy();
    });
    socket.on('error', (error) => {
      console.error('Error handling WebSocket upgrade:', error);
      targetWs.terminate();
    });
  }
}

module.exports = ProxyEngine;