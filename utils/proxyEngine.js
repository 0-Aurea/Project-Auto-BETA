const http = require('http');
const https = require('https');
const tls = require('tls');
const WebSocket = require('ws');
const { URL } = require('url');
const { promisify } = require('util');
const { createServer } = require('http');
const { createSecureServer } = require('https');
const { TLSCertificateManager } = require('./tlsCertificateManager');
const { EncodingUtils } = require('./encoding');
const { REQUEST_HEADER_REWRITE_LIST } = require('./constants');
const { UrlUtils } = require('./urlUtils');
const { CssRewriterUtils } = require('./cssRewriter');
const { HTMLRewriter } = require('./htmlRewriter');
const { JSRewriterUtils } = require('./jsRewriter');
const { HeaderRewriterUtils } = require('./headerRewriter');

class ProxyEngine {
  constructor() {
    this.server = null;
    this.tlsCertificateManager = new TLSCertificateManager();
    this.wss = null;
  }

  async init() {
    await this.tlsCertificateManager.init();
    this.server = createServer(this.handleRequest.bind(this));
    this.httpsServer = createSecureServer({
      key: await this.tlsCertificateManager.getPrivateKey(),
      cert: await this.tlsCertificateManager.getCertificate(),
    }, this.handleHttpsRequest.bind(this));
    this.wss = new WebSocket.Server({ server: this.httpsServer }, () => {});
    this.wss.on('connection', this.handleWebSocketConnection.bind(this));
  }

  async handleRequest(req, res) {
    if (req.url.startsWith('/service/')) {
      const encodedUrl = req.url.substring(9);
      const url = EncodingUtils.decodeUrl(encodedUrl);
      try {
        const { response, buffer } = await this.fetchUrl(url);
        this.rewriteResponse({ response, buffer }, res);
        res.end();
      } catch (error) {
        console.error(error);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  async handleHttpsRequest(req, socket, head) {
    if (req.url.startsWith('/service/')) {
      const encodedUrl = req.url.substring(9);
      const url = EncodingUtils.decodeUrl(encodedUrl);
      try {
        const { response, buffer } = await this.fetchUrl(url);
        this.rewriteResponse({ response, buffer }, socket);
        socket.end();
      } catch (error) {
        console.error(error);
        socket.destroy();
      }
    } else {
      const url = `https://${req.headers.host}${req.url}`;
      try {
        const tlsSocket = await this.establishTlsTunnel(url);
        req.pipe(tlsSocket);
        tlsSocket.pipe(socket);
      } catch (error) {
        console.error(error);
        socket.destroy();
      }
    }
  }

  async handleWebSocketConnection(ws, req) {
    const url = `ws://${req.headers.host}${req.url}`;
    try {
      const webSocket = await this.establishWebSocketTunnel(url);
      ws.pipe(webSocket);
      webSocket.pipe(ws);
    } catch (error) {
      console.error(error);
      ws.destroy();
    }
  }

  async fetchUrl(url) {
    const options = {
      method: 'GET',
      headers: {},
    };
    return new Promise((resolve, reject) => {
      const req = http.request(url, options, (response) => {
        let data = [];
        response.on('data', (chunk) => {
          data.push(chunk);
        });
        response.on('end', () => {
          const buffer = Buffer.concat(data);
          resolve({ response, buffer });
        });
      });
      req.on('error', (error) => {
        reject(error);
      });
      req.end();
    });
  }

  async rewriteResponse({ response, buffer }, res) {
    const headers = response.headers;
    HeaderRewriterUtils.HEADERS_TO_STRIP.forEach((header) => delete headers[header]);
    if (headers['location']) {
      headers['location'] = this.rewriteUrl(headers['location']);
    }
    if (headers['set-cookie']) {
      headers['set-cookie'] = headers['set-cookie'].map((cookie) => this.rewriteCookie(cookie));
    }
    Object.keys(headers).forEach((key) => {
      res.setHeader(key, headers[key]);
    });
    res.writeHead(response.statusCode);
    if (buffer) {
      const rewrittenBuffer = await this.rewriteBuffer(buffer, response);
      res.end(rewrittenBuffer);
    } else {
      res.end();
    }
  }

  async rewriteBuffer(buffer, response) {
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      return HTMLRewriter.rewrite(buffer.toString());
    } else if (contentType && contentType.includes('application/javascript')) {
      return JSRewriterUtils.rewrite(buffer.toString());
    } else if (contentType && contentType.includes('text/css')) {
      return CssRewriterUtils.rewrite(buffer.toString());
    }
    return buffer;
  }

  rewriteUrl(url) {
    const { hostname, pathname, search, hash } = new URL(url);
    return UrlUtils.rewriteUrl(hostname, pathname, search, hash);
  }

  rewriteCookie(cookie) {
    return cookie.replace(/Domain=[^;]*/, '');
  }

  async establishTlsTunnel(url) {
    return new Promise((resolve, reject) => {
      const tlsSocket = tls.connect(url, (stream) => {
        resolve(stream);
      });
      tlsSocket.on('error', (error) => {
        reject(error);
      });
    });
  }

  async establishWebSocketTunnel(url) {
    return new Promise((resolve, reject) => {
      const webSocket = new WebSocket(url);
      webSocket.on('open', () => {
        resolve(webSocket);
      });
      webSocket.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = { ProxyEngine };