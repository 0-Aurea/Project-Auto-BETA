const { createServer } = require('https');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { ServerResponse, IncomingMessage } = require('http');
const { URL } = require('url');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');

/**
 * HTTPS tunnel utility class for managing the integrated HTTPS tunnel.
 */
class HTTSTunnelUtils {
  /**
   * HTTPS server instance.
   */
  static httpsServer;

  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Options for the HTTPS tunnel.
   */
  static options = {
    key: fs.readFileSync(path.join(__dirname, 'privkey.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
  };

  /**
   * Initialize the HTTPS tunnel.
   * @param {function} handler - The request handler.
   */
  static init(handler) {
    HTTSTunnelUtils.httpsServer = createServer(HTTSTunnelUtils.options, async (req, res) => {
      try {
        await handler(req, res);
      } catch (error) {
        console.error('HTTPS tunnel error:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    HTTSTunnelUtils.wss = new WebSocket.Server({ server: HTTSTunnelUtils.httpsServer });

    HTTSTunnelUtils.wss.on('connection', (ws, req) => {
      try {
        const url = new URL(req.url, 'https://example.com');
        const { pathname, search } = url;

        if (pathname === '/websocket') {
          // Handle WebSocket connection
          ws.on('message', (message) => {
            console.log(`Received WebSocket message: ${message}`);
            ws.send(`Server response: ${message}`);
          });

          ws.on('close', () => {
            console.log('WebSocket connection closed');
          });

          ws.on('error', (error) => {
            console.error('WebSocket error:', error);
          });
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });
  }

  /**
   * Create a proxy middleware for the HTTPS tunnel.
   * @param {string} target - The target URL.
   * @param {object} options - Options for the proxy middleware.
   * @returns {function} The proxy middleware.
   */
  static createProxyMiddleware(target, options) {
    return createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { '^/': '' },
      ...options,
      onProxyReq: (proxyReq, req, res) => {
        // Implement header rewriting
        proxyReq.headers['upgrade'] = req.headers['upgrade'];
        proxyReq.headers['connection'] = req.headers['connection'];
      },
      onProxyRes: (proxyRes, req, res) => {
        // Implement header rewriting
        res.headers['content-security-policy'] = '';
        res.headers['strict-transport-security'] = '';
        res.headers['x-frame-options'] = '';
        res.headers['access-control-allow-origin'] = '*';
        res.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
      },
    });
  }

  /**
   * Handle an incoming request.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   * @returns {Promise<void>}
   */
  static async handleRequest(req, res) {
    const url = new URL(req.url, 'https://example.com');
    const { pathname, search } = url;

    if (pathname === '/') {
      // Handle root URL
      res.writeHead(200);
      res.end('NEXUS HTTPS Tunnel');
    } else if (pathname.startsWith('/service/')) {
      // Handle proxied requests
      const targetUrl = decodeURIComponent(pathname.substring(9));
      const proxyMiddleware = HTTSTunnelUtils.createProxyMiddleware(targetUrl, {
        onProxyRes: (proxyRes, req, res) => {
          // Implement header rewriting
          res.headers['content-security-policy'] = '';
          res.headers['strict-transport-security'] = '';
          res.headers['x-frame-options'] = '';
          res.headers['access-control-allow-origin'] = '*';
          res.headers['access-control-allow-headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
        },
      });
      proxyMiddleware(req, res);
    } else if (pathname === '/websocket') {
      // Handle WebSocket connection
      const ws = new WebSocket(req, req.headers['sec-websocket-protocol']);
      ws.on('message', (message) => {
        console.log(`Received WebSocket message: ${message}`);
        ws.send(`Server response: ${message}`);
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } else {
      // Handle other URLs
      res.writeHead(404);
      res.end('Not Found');
    }
  }
}

module.exports = HTTSTunnelUtils;