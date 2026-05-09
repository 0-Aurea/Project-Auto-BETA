const WebSocket = require('ws');
const { URL } = require('url');
const { CookieScopingUtils } = require('./cookieScoping');
const { EncodingUtils } = require('./encodingUtils');
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

    this.wss.on('connection', async (ws, req) => {
      try {
        const { headers, url } = req;
        const { origin, pathname } = new URL(url, 'http://example.com');

        // Handle WebSocket handshake
        ws.on('message', async (message) => {
          PerformanceMonitor.startMetric('websocketMessageHandling');
          // Rewrite WebSocket message headers
          const rewrittenMessage = await WebSocketProxyUtils.rewriteMessage(message, headers, origin);

          // Forward rewritten message to target WebSocket server
          const targetWs = new WebSocket(origin, {
            headers: WebSocketProxyUtils.rewriteHeaders(headers, origin),
          });

          targetWs.on('open', () => {
            targetWs.send(rewrittenMessage);
          });

          targetWs.on('message', async (targetMessage) => {
            PerformanceMonitor.startMetric('websocketTargetMessageHandling');
            // Rewrite target WebSocket message headers
            const rewrittenTargetMessage = await WebSocketProxyUtils.rewriteMessage(targetMessage, headers, origin);

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
          PerformanceMonitor.endMetric('websocketMessageHandling');
        });
      } catch (error) {
        console.error('WebSocket proxy error:', error);
      }
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
  static async rewriteMessage(message, headers, origin) {
    try {
      // Isolate cookies per proxied origin
      const cookieHeader = headers['cookie'];
      const isolatedCookieHeader = CookieScopingUtils.isolateCookies(cookieHeader, origin);

      // Remove sensitive headers
      const filteredHeaders = EncodingUtils.filterHeaders(headers, REQUEST_HEADER_REWRITE_LIST);

      // Rewrite headers
      const rewrittenHeaders = {
        ...filteredHeaders,
        'Cookie': isolatedCookieHeader,
      };

      // Inject rewritten headers into WebSocket message
      const rewrittenMessage = EncodingUtils.injectHeaders(message, rewrittenHeaders);

      return rewrittenMessage;
    } catch (error) {
      console.error('Error rewriting WebSocket message:', error);
      return message;
    }
  }

  /**
   * Rewrite WebSocket request headers.
   * @param {object} headers - The WebSocket request headers.
   * @param {string} origin - The origin of the WebSocket request.
   * @returns {object} The rewritten WebSocket request headers.
   */
  static rewriteHeaders(headers, origin) {
    try {
      // Remove sensitive headers
      const filteredHeaders = EncodingUtils.filterHeaders(headers, REQUEST_HEADER_REWRITE_LIST);

      // Add or modify headers as needed
      const rewrittenHeaders = {
        ...filteredHeaders,
        'Origin': origin,
      };

      return rewrittenHeaders;
    } catch (error) {
      console.error('Error rewriting WebSocket headers:', error);
      return headers;
    }
  }

  /**
   * Handle WebSocket errors.
   * @param {Error} error - The WebSocket error.
   */
  static handleWebSocketError(error) {
    console.error('WebSocket error:', error);
  }
}

module.exports = WebSocketProxyUtils;