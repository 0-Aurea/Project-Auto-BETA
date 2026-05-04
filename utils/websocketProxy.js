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
      const scopedCookieHeader = CookieScopingUtils.scopeCookies(cookieHeader, origin);
      headers['cookie'] = scopedCookieHeader;
    }

    // Perform header rewriting
    const rewrittenHeaders = this.rewriteHeaders(headers, origin);

    // No need to rewrite the message body for WebSocket messages
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

    // Iterate over each header
    for (const [header, value] of Object.entries(headers)) {
      // Check if the header needs to be rewritten
      if (REQUEST_HEADER_REWRITE_LIST.includes(header)) {
        // Perform header rewriting
        rewrittenHeaders[header] = this.rewriteHeader(header, value, origin);
      } else {
        rewrittenHeaders[header] = value;
      }
    }

    // Remove any sensitive headers
    for (const header of RESPONSE_HEADER_REWRITE_LIST) {
      delete rewrittenHeaders[header];
    }

    return rewrittenHeaders;
  }

  /**
   * Rewrite a single WebSocket header.
   * @param {string} header - The header to rewrite.
   * @param {string} value - The header value.
   * @param {string} origin - The origin of the WebSocket request.
   * @returns {string} The rewritten header value.
   */
  static rewriteHeader(header, value, origin) {
    switch (header) {
      case 'origin':
        return origin;
      case 'host':
        return new URL(origin).hostname;
      default:
        return value;
    }
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