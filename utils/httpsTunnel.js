const { createServer } = require('https');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { ServerResponse, IncomingMessage } = require('http');
const { URL } = require('url');

/**
 * HTTPS tunnel utility class for managing the integrated HTTPS tunnel.
 */
class HTTSTunnelUtils {
  /**
   * HTTPS server instance.
   */
  static httpsServer;

  /**
   * Options for the HTTPS tunnel.
   */
  static options = {
    key: fs.readFileSync('path/to/privkey.pem'),
    cert: fs.readFileSync('path/to/cert.pem'),
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
      // Handle root request
      res.writeHead(200);
      res.end('Nexus HTTPS Tunnel');
    } else {
      // Handle proxied request
      const proxyMiddleware = HTTSTunnelUtils.createProxyMiddleware('https://example.com', {
        bypass: (req) => {
          // Implement bypass logic
        },
      });

      await proxyMiddleware(req, res);
    }
  }
}

module.exports = HTTSTunnelUtils;