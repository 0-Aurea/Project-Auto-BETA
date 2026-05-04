const WebSocket = require('ws');
const { URL } = require('url');
const { CookieScopingUtils } = require('./cookieScoping');
const { Encoding } = require('./encoding');
const { REQUEST_HEADER_REWRITE_LIST, RESPONSE_HEADER_REWRITE_LIST } = require('./constants');

/**
 * WebSocket proxy utility class for handling WebSocket upgrade proxying with header rewriting.
 */
class WebSocketProxyUtils {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Options for the WebSocket proxy.
   */
  static options = {
    // Add WebSocket proxy options here
  };

  /**
   * Initialize the WebSocket proxy.
   * @param {object} server - The HTTP server instance.
   */
  static init(server) {
    this.wss = new WebSocket.Server({ server, ...this.options });

    this.wss.on('connection', (ws, req) => {
      const { headers, url } = req;
      const { origin, pathname } = new URL(url, 'http://example.com');

      // Handle WebSocket handshake
      ws.on('message', (message) => {
        // Rewrite WebSocket message headers
        const rewrittenMessage = this.rewriteMessage(message, headers, origin);

        // Forward rewritten message to target WebSocket server
        const targetWs = new WebSocket(origin, {
          headers: this.rewriteHeaders(headers, origin),
        });
        targetWs.on('open', () => {
          targetWs.send(rewrittenMessage);
        });

        targetWs.on('message', (targetMessage) => {
          // Rewrite target WebSocket message headers
          const rewrittenTargetMessage = this.rewriteMessage(targetMessage, headers, origin);

          // Forward rewritten target message to client WebSocket
          ws.send(rewrittenTargetMessage);
        });

        targetWs.on('error', (error) => {
          console.error('Target WebSocket error:', error);
        });

        targetWs.on('close', () => {
          ws.close();
        });
      });

      ws.on('error', (error) => {
        console.error('Client WebSocket error:', error);
      });

      ws.on('close', () => {
        // Handle client WebSocket closure
      });
    });
  }

  /**
   * Rewrite WebSocket message headers.
   * @param {string} message - The WebSocket message to rewrite.
   * @param {object} headers - The WebSocket request headers.
   * @param {string} origin - The origin of the WebSocket request.
   * @returns {string} The rewritten WebSocket message.
   */
  static rewriteMessage(message, headers, origin) {
    // Implement WebSocket message rewriting logic here
    // For example, rewrite Cookie headers to isolate cookies per proxied origin
    const cookieHeader = headers['cookie'];
    if (cookieHeader) {
      const rewrittenCookieHeader = CookieScopingUtils.isolateCookies(cookieHeader, origin);
      headers['cookie'] = rewrittenCookieHeader;
    }

    // Encode URL using current salt
    const encodedOrigin = Encoding.encodeUrl(origin);

    // Return rewritten WebSocket message
    return message;
  }

  /**
   * Rewrite WebSocket request and response headers.
   * @param {object} headers - The WebSocket request or response headers.
   * @param {string} origin - The origin of the WebSocket request.
   * @returns {object} The rewritten WebSocket headers.
   */
  static rewriteHeaders(headers, origin) {
    const rewrittenHeaders = {};

    // Rewrite request headers
    Object.keys(headers).forEach((header) => {
      if (REQUEST_HEADER_REWRITE_LIST.includes(header)) {
        // Strip sensitive headers
        return;
      }

      if (header.toLowerCase() === 'cookie') {
        const rewrittenCookieHeader = CookieScopingUtils.isolateCookies(headers[header], origin);
        rewrittenHeaders[header] = rewrittenCookieHeader;
      } else {
        rewrittenHeaders[header] = headers[header];
      }
    });

    // Add WebSocket-specific headers
    rewrittenHeaders['sec-websocket-protocol'] = 'nexus-proxy';

    return rewrittenHeaders;
  }

  /**
   * Handle WebSocket upgrade proxying.
   * @param {object} req - The HTTP request object.
   * @param {object} res - The HTTP response object.
   */
  static handleUpgrade(req, res) {
    const { headers, url } = req;
    const { origin, pathname } = new URL(url, 'http://example.com');

    // Perform WebSocket upgrade
    this.wss.handleUpgrade(req, res, (ws) => {
      this.wss.emit('connection', ws, req);
    });
  }
}

module.exports = WebSocketProxyUtils;