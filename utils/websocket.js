const WebSocket = require('ws');
const { URL } = require('url');
const { UrlUtils } = require('./urlUtils');

/**
 * WebSocket utility class for handling WebSocket upgrade proxying.
 */
class WebSocketUtils {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Initialize the WebSocket server.
   * @param {object} options - WebSocket server options.
   */
  static async init(options) {
    WebSocketUtils.wss = new WebSocket.Server(options);

    WebSocketUtils.wss.on('connection', (ws, req) => {
      const { headers, url } = req;

      // Handle WebSocket upgrade request
      const upgradeHeader = headers['sec-websocket-protocol'];
      if (upgradeHeader) {
        // Handle subprotocol negotiation
        const subprotocols = upgradeHeader.split(',');
        const selectedSubprotocol = subprotocols[0].trim();

        // Send WebSocket upgrade response
        ws.on('message', (message) => {
          // Handle incoming WebSocket message
          const encodedMessage = UrlUtils.encodeUrl(message, ' rotating-salt ');
          // Forward the message to the target WebSocket
          WebSocketUtils.forwardMessage(encodedMessage, ws);
        });

        ws.on('error', (error) => {
          // Handle WebSocket error
          globalThis.console.error('WebSocket error:', error);
        });

        ws.on('close', () => {
          // Handle WebSocket close
          globalThis.console.log('WebSocket closed');
        });
      }
    });
  }

  /**
   * Forwards a WebSocket message to the target WebSocket.
   * @param {string} message - The WebSocket message to forward.
   * @param {WebSocket} ws - The WebSocket instance.
   */
  static async forwardMessage(message, ws) {
    try {
      const targetUrl = new URL(ws.url);
      const targetWs = new WebSocket(targetUrl.href);

      targetWs.on('open', () => {
        targetWs.send(message);
      });

      targetWs.on('message', (incomingMessage) => {
        // Handle incoming message from target WebSocket
        const decodedMessage = UrlUtils.decodeUrl(incomingMessage, ' rotating-salt ');
        ws.send(decodedMessage);
      });

      targetWs.on('error', (error) => {
        // Handle error from target WebSocket
        globalThis.console.error('Target WebSocket error:', error);
      });

      targetWs.on('close', () => {
        // Handle close of target WebSocket
        globalThis.console.log('Target WebSocket closed');
      });
    } catch (error) {
      globalThis.console.error('Error forwarding WebSocket message:', error);
    }
  }

  /**
   * Handles WebSocket header rewriting.
   * @param {object} headers - The WebSocket headers to rewrite.
   * @returns {object} The rewritten WebSocket headers.
   */
  static rewriteHeaders(headers) {
    // Remove sensitive headers
    delete headers['sec-websocket-protocol'];
    delete headers['sec-websocket-extensions'];

    // Rewrite Origin header
    headers['origin'] = 'https://example.com'; // Replace with desired origin

    return headers;
  }
}

module.exports = { WebSocketUtils };