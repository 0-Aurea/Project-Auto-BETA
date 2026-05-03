const WebSocket = require('ws');
const { URL } = require('url');

/**
 * WebSocket utility class for managing WebSocket upgrade proxying.
 */
class WebSocketProxy {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Initialize the WebSocket server.
   * @param {Server} server - The HTTP server instance.
   */
  static init(server) {
    WebSocketProxy.wss = new WebSocket.Server({ server });

    WebSocketProxy.wss.on('connection', (ws, req) => {
      const { headers, url } = req;

      // Handle WebSocket upgrade request
      const proxiedUrl = WebSocketProxy.getProxiedUrl(url);
      const destination = new URL(proxiedUrl);
      const destinationHeaders = WebSocketProxy.rewriteHeaders(headers);

      // Establish connection to the proxied WebSocket server
      const proxiedWs = new WebSocket(destination.href, {
        headers: destinationHeaders,
      });

      // Handle messages from the client
      ws.on('message', (message) => {
        proxiedWs.send(message);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
      });

      // Handle close event
      ws.on('close', () => {
        proxiedWs.close();
      });

      // Handle messages from the proxied WebSocket server
      proxiedWs.on('message', (message) => {
        ws.send(message);
      });

      // Handle errors
      proxiedWs.on('error', (error) => {
        console.error('WebSocket proxied server error:', error);
      });

      // Handle close event
      proxiedWs.on('close', () => {
        ws.close();
      });
    });
  }

  /**
   * Get the proxied URL for the given WebSocket URL.
   * @param {string} url - The WebSocket URL to proxy.
   * @returns {string} The proxied URL.
   */
  static getProxiedUrl(url) {
    // Implement URL rewriting logic here
    return url;
  }

  /**
   * Rewrite headers for the proxied WebSocket request.
   * @param {object} headers - The original headers.
   * @returns {object} The rewritten headers.
   */
  static rewriteHeaders(headers) {
    const rewrittenHeaders = { ...headers };

    // Remove sensitive headers
    delete rewrittenHeaders['sec-websocket-protocol'];
    delete rewrittenHeaders['sec-websocket-version'];

    return rewrittenHeaders;
  }
}

module.exports = WebSocketProxy;