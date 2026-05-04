const WebSocket = require('ws');
const { URL } = require('url');
const { CookieScopingUtils } = require('./cookieScoping');
const { Encoding } = require('./encoding');
const { REQUEST_HEADER_REWRITE_LIST, RESPONSE_HEADER_REWRITE_LIST } = require('./constants');
const { PerformanceMonitor } = require('./performanceMonitor');

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
    // No additional options are required for now
  };

  /**
   * Initialize the WebSocket proxy.
   * @param {object} server - The HTTP server instance.
   */
  static init(server) {
    PerformanceMonitor.startMetric('websocketProxyInit');
    this.wss = new WebSocket.Server({ server, ...this.options });

    this.wss.on('connection', (ws, req) => {
      const { headers, url } = req;
      const { origin, pathname } = new URL(url, 'http://example.com');

      // Handle WebSocket handshake
      ws.on('message', (message) => {
        PerformanceMonitor.startMetric('websocketMessageHandling');
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
          PerformanceMonitor.startMetric('websocketTargetMessageHandling');
          // Rewrite target WebSocket message headers
          const rewrittenTargetMessage = this.rewriteMessage(targetMessage, headers, origin);

          // Forward rewritten target message to client WebSocket
          ws.send(rewrittenTargetMessage);
          PerformanceMonitor.endMetric('websocketTargetMessageHandling');
        });

        targetWs.on('error', (error) => {
          console.error('Target WebSocket error:', error);
          ws.close();
        });

        targetWs.on('close', () => {
          ws.close();
        });
      });

      ws.on('error', (error) => {
        console.error('Client WebSocket error:', error);
        ws.close();
      });

      ws.on('close', () => {
        // Handle client WebSocket closure
      });
    });
    PerformanceMonitor.endMetric('websocketProxyInit');
  }

  /**
   * Rewrite WebSocket message headers.
   * @param {string} message - The WebSocket message to rewrite.
   * @param {object} headers - The WebSocket request headers.
   * @param {string} origin - The origin of the WebSocket request.
   * @returns {string} The rewritten WebSocket message.
   */
  static rewriteMessage(message, headers, origin) {
    // Isolate cookies per proxied origin
    const cookieHeader = headers['cookie'];
    if (cookieHeader) {
      const rewrittenCookieHeader = CookieScopingUtils.isolateCookies(cookieHeader, origin);
      headers['cookie'] = rewrittenCookieHeader;
    }

    // Remove sensitive headers
    REQUEST_HEADER_REWRITE_LIST.forEach((header) => {
      delete headers[header];
    });

    // Encode URL using current salt
    const encodedOrigin = Encoding.encodeUrl(origin);

    return message;
  }

  /**
   * Rewrite WebSocket request headers.
   * @param {object} headers - The WebSocket request headers.
   * @param {string} origin - The origin of the WebSocket request.
   * @returns {object} The rewritten WebSocket request headers.
   */
  static rewriteHeaders(headers, origin) {
    // Remove sensitive headers
    REQUEST_HEADER_REWRITE_LIST.forEach((header) => {
      delete headers[header];
    });

    // Add or modify headers as needed
    headers['origin'] = origin;

    return headers;
  }

  /**
   * Handle WebSocket errors.
   * @param {Error} error - The WebSocket error.
   */
  static handleError(error) {
    console.error('WebSocket error:', error);
  }
}

module.exports = WebSocketProxyUtils;