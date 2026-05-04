const { WebSocket } = require('ws');
const { URL } = require('url');
const { REQUEST_HEADER_REWRITE_LIST, RESPONSE_HEADER_REWRITE_LIST } = require('./constants');

/**
 * WebSocket utility class for handling WebSocket upgrade proxying with header rewriting and subprotocol support.
 */
class WebSocketUtils {
  /**
   * Regular expression to match WebSocket upgrade requests.
   */
  static WEBSOCKET_UPGRADE_REGEX = /^\/$/;

  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Options for the WebSocket server.
   */
  static options = {
    // Add WebSocket server options here
    maxPayload: 1024 * 1024 * 10, // 10MB payload limit
  };

  /**
   * Initialize the WebSocket server.
   * @param {http.Server} server - The HTTP server instance.
   */
  static init(server) {
    WebSocketUtils.wss = new WebSocket.Server({ server, ...WebSocketUtils.options });

    WebSocketUtils.wss.on('connection', (ws, req) => {
      // Handle WebSocket connection handshake
      const { headers, method, url } = req;

      // Rewrite WebSocket upgrade request headers
      const rewrittenHeaders = { ...headers };
      REQUEST_HEADER_REWRITE_LIST.forEach((header) => {
        delete rewrittenHeaders[header];
      });

      // Handle WebSocket messages
      ws.on('message', (message) => {
        // Handle and rewrite WebSocket messages
        const { type, data } = JSON.parse(message);
        switch (type) {
          case 'text':
            // Handle text messages
            ws.send(JSON.stringify({ type: 'text', data: data.toString() }));
            break;
          case 'binary':
            // Handle binary messages
            ws.send(Buffer.from(data));
            break;
          default:
            // Handle unknown message types
            console.error(`Unknown message type: ${type}`);
        }
      });

      // Handle WebSocket close events
      ws.on('close', () => {
        // Handle WebSocket close events
      });

      // Handle WebSocket errors
      ws.on('error', (error) => {
        // Handle WebSocket errors
        console.error(`WebSocket error: ${error}`);
      });
    });
  }

  /**
   * Handle WebSocket upgrade requests.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {http.ServerResponse} res - The server response.
   * @param {string} target - The target URL for the WebSocket connection.
   */
  static handleUpgrade(req, res, target) {
    if (!WebSocketUtils.WEBSOCKET_UPGRADE_REGEX.test(req.url)) {
      return;
    }

    const { headers, method, url } = req;

    // Rewrite WebSocket upgrade request headers
    const rewrittenHeaders = { ...headers };
    REQUEST_HEADER_REWRITE_LIST.forEach((header) => {
      delete rewrittenHeaders[header];
    });

    // Establish the WebSocket connection
    WebSocketUtils.wss.handleUpgrade(req, res, (ws) => {
      WebSocketUtils.wss.emit('connection', ws, req);

      // Proxy WebSocket connection through the HTTPS tunnel
      WebSocketUtils.proxyWebSocket(target, req, res, ws);
    });
  }

  /**
   * Proxy WebSocket connections through the HTTPS tunnel.
   * @param {string} target - The target URL for the WebSocket connection.
   * @param {http.IncomingMessage} req - The incoming request.
   * @param {http.ServerResponse} res - The server response.
   * @param {WebSocket} ws - The WebSocket instance.
   */
  static proxyWebSocket(target, req, res, ws) {
    const { headers, method, url } = req;

    // Establish the WebSocket connection through the HTTPS tunnel
    const targetWs = new WebSocket(target, {
      headers: {
        ...headers,
        'Sec-WebSocket-Protocol': headers['sec-webSocket-protocol'],
      },
    });

    // Handle WebSocket open events
    targetWs.on('open', () => {
      // Forward WebSocket messages to the target WebSocket
      ws.on('message', (message) => {
        targetWs.send(message);
      });

      // Forward WebSocket messages from the target WebSocket
      targetWs.on('message', (message) => {
        ws.send(message);
      });
    });

    // Handle WebSocket close events
    targetWs.on('close', () => {
      // Handle WebSocket close events
      ws.close();
    });

    // Handle WebSocket errors
    targetWs.on('error', (error) => {
      // Handle WebSocket errors
      console.error(`WebSocket error: ${error}`);
    });

    // Rewrite WebSocket response headers
    targetWs.on('headers', (headers) => {
      const rewrittenHeaders = { ...headers };
      RESPONSE_HEADER_REWRITE_LIST.forEach((header) => {
        delete rewrittenHeaders[header];
      });
    });
  }
}

module.exports = WebSocketUtils;