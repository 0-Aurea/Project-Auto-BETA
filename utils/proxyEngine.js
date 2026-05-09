const http = require('http');
const https = require('https');
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
    if (headers['content-type'] && headers['content-type'].includes('text/html')) {
      buffer = await this.rewriteHtml(buffer);
    } else if (headers['content-type'] && headers['content-type'].includes('text/css')) {
      buffer = await this.rewriteCss(buffer);
    } else if (headers['content-type'] && headers['content-type'].includes('application/javascript')) {
      buffer = await this.rewriteJs(buffer);
    }
    res.end(buffer);
  }

  async rewriteHtml(buffer) {
    const html = buffer.toString();
    return HTMLRewriter.rewriteHtml(html);
  }

  async rewriteCss(buffer) {
    const css = buffer.toString();
    return CssRewriterUtils.rewriteCss(css);
  }

  async rewriteJs(buffer) {
    const js = buffer.toString();
    return JSRewriterUtils.rewriteJs(js);
  }

  rewriteUrl(url) {
    const { hostname, pathname } = new URL(url);
    return `/${hostname}${pathname}`;
  }

  rewriteCookie(cookie) {
    return cookie.replace(/domain=[^;]*/, '');
  }

  async establishTlsTunnel(url) {
    const tlsOptions = {
      rejectUnauthorized: false,
    };
    return new Promise((resolve, reject) => {
      const tlsSocket = tls.connect(url, tlsOptions, () => {
        resolve(tlsSocket);
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

  start() {
    const port = 8080;
    this.server.listen(port, () => {
      console.log(`Proxy server listening on port ${port}`);
    });
    this.httpsServer.listen(8443, () => {
      console.log('Proxy server listening on port 8443 (HTTPS)');
    });
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.init().then(() => {
  proxyEngine.start();
}).catch((error) => {
  console.error(error);
});