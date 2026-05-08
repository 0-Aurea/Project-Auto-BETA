const http = require('http');
const https = require('https');
const tls = require('tls');
const WebSocket = require('ws');
const { URL } = require('url');
const { promisify } = require('util');
const { createServer } = require('http');
const { createSecureServer } = require('https');
const { TLSCertificateManager } = require('./tlsCertificateManager');
const { EncodingUtils } = require('./encodingUtils');
const { REQUEST_HEADER_REWRITE_LIST } = require('./constants');
const { UrlUtils } = require('./urlUtils');
const { CssRewriterUtils } = require('./cssRewriter');
const { HTMLRewriter } = require('./htmlRewriter');
const { JSRewriterUtils } = require('./jsRewriter');

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
    REQUEST_HEADER_REWRITE_LIST.forEach((header) => delete headers[header]);
    if (headers['location']) {
      headers['location'] = this.rewriteUrl(headers['location']);
    }
    if (headers['set-cookie']) {
      headers['set-cookie'] = headers['set-cookie'].map((cookie) => this.rewriteCookie(cookie));
    }
    if (headers['content-type'] && headers['content-type'].includes('text/html')) {
      buffer = await HTMLRewriter.rewrite(buffer.toString(), this.rewriteUrl.bind(this));
    } else if (headers['content-type'] && headers['content-type'].includes('text/css')) {
      buffer = await CssRewriterUtils.rewrite(buffer.toString(), this.rewriteUrl.bind(this));
    } else if (headers['content-type'] && headers['content-type'].includes('application/javascript')) {
      buffer = await JSRewriterUtils.rewrite(buffer.toString(), this.rewriteUrl.bind(this));
    }
    res.writeHead(response.statusCode, headers);
    res.end(buffer);
  }

  rewriteUrl(url) {
    const { hostname, pathname, search, hash } = new URL(url);
    return `/${EncodingUtils.encodeUrl(`http://${hostname}${pathname}${search}${hash}`)}`;
  }

  rewriteCookie(cookie) {
    return cookie.replace(/domain=[^;]*/g, '');
  }

  async establishTlsTunnel(url) {
    return new Promise((resolve, reject) => {
      const tlsSocket = tls.connect(url, (socket) => {
        resolve(socket);
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