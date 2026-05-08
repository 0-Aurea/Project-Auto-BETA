const http = require('http');
const https = require('https');
const tls = require('tls');
const { URL } = require('url');
const { promisify } = require('util');
const { createServer } = require('http');
const { createSecureServer } = require('https');
const { TLSCertificateManager } = require('./tlsCertificateManager');
const { EncodingUtils } = require('./encodingUtils');

class ProxyEngine {
  constructor() {
    this.server = null;
    this.tlsCertificateManager = new TLSCertificateManager();
  }

  async init() {
    await this.tlsCertificateManager.init();
    this.server = createServer(this.handleRequest.bind(this));
    this.httpsServer = createSecureServer({
      key: await this.tlsCertificateManager.getPrivateKey(),
      cert: await this.tlsCertificateManager.getCertificate(),
    }, this.handleHttpsRequest.bind(this));
  }

  async handleRequest(req, res) {
    if (req.url.startsWith('/service/')) {
      const encodedUrl = req.url.substring(9);
      const url = EncodingUtils.decodeUrl(encodedUrl);
      try {
        const response = await this.fetchUrl(url);
        this.rewriteResponse(response, res);
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

  async fetchUrl(url) {
    const response = await promisify(http.get)(url);
    return response;
  }

  rewriteResponse(response, res) {
    const headers = response.headers;
    delete headers['content-security-policy'];
    delete headers['strict-transport-security'];
    delete headers['x-frame-options'];
    res.writeHead(response.statusCode, headers);
    response.pipe(res);
  }

  async establishTlsTunnel(url) {
    const tlsOptions = {
      rejectUnauthorized: false,
    };
    return new Promise((resolve, reject) => {
      const tlsSocket = tls.connect(url, tlsOptions, (stream) => {
        resolve(stream);
      });
      tlsSocket.on('error', (error) => {
        reject(error);
      });
    });
  }

  async start() {
    await this.init();
    this.server.listen(8080, () => {
      console.log('Proxy server listening on port 8080');
    });
    this.httpsServer.listen(8443, () => {
      console.log('Proxy server listening on port 8443');
    });
  }
}

const proxyEngine = new ProxyEngine();
proxyEngine.start();

async function handleWebSocketRequest(req, socket, head) {
  const url = `ws://${req.headers.host}${req.url}`;
  try {
    const webSocket = await establishWebSocketTunnel(url);
    req.pipe(webSocket);
    webSocket.pipe(socket);
  } catch (error) {
    console.error(error);
    socket.destroy();
  }
}

async function establishWebSocketTunnel(url) {
  const webSocketOptions = {
    rejectUnauthorized: false,
  };
  return new Promise((resolve, reject) => {
    const webSocket = new WebSocket(url, webSocketOptions);
    webSocket.on('open', () => {
      resolve(webSocket);
    });
    webSocket.on('error', (error) => {
      reject(error);
    });
  });
}