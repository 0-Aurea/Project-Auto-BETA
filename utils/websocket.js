const WebSocket = require('ws');
const { URL } = require('url');
const { performance } = require('perf_hooks');

/**
 * WebSocket utility class for handling WebSocket upgrade proxying with better header rewriting, subprotocol support, and error handling.
 */
class WebSocketUtils {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Initialize the WebSocket server.
   * @param {object} options - WebSocket server options.
   * @param {string} options.host - The WebSocket server host.
   * @param {number} options.port - The WebSocket server port.
   * @param {function} options.handleConnection - The WebSocket connection handler.
   */
  static async init(options) {
    WebSocketUtils.wss = new WebSocket.Server(options);
    WebSocketUtils.wss.on('connection', (ws, req) => {
      WebSocketUtils.handleConnection(ws, req);
    });
  }

  /**
   * Handle WebSocket connections.
   * @param {WebSocket} ws - The WebSocket instance.
   * @param {object} req - The WebSocket request object.
   */
  static handleConnection(ws, req) {
    const { headers, url } = req;
    const { Sec-WebSocket-Protocol: protocol } = headers;

    // Handle WebSocket subprotocols
    if (protocol) {
      ws.protocol = protocol;
    }

    // Handle WebSocket headers
    WebSocketUtils.handleHeaders(ws, headers);

    ws.on('message', (message) => {
      WebSocketUtils.handleMessage(ws, message);
    });

    ws.on('error', (error) => {
      WebSocketUtils.handleError(ws, error);
    });

    ws.on('close', () => {
      WebSocketUtils.handleClose(ws);
    });
  }

  /**
   * Handle WebSocket headers.
   * @param {WebSocket} ws - The WebSocket instance.
   * @param {object} headers - The WebSocket headers.
   */
  static handleHeaders(ws, headers) {
    // Rewrite WebSocket headers
    const { Origin: origin, Host: host, 'Sec-WebSocket-Key': secKey } = headers;

    // Handle WebSocket origin
    if (origin) {
      ws.origin = origin;
    }

    // Handle WebSocket host
    if (host) {
      ws.host = host;
    }

    // Handle WebSocket Sec-WebSocket-Key
    if (secKey) {
      ws.secKey = secKey;
    }
  }

  /**
   * Handle WebSocket messages.
   * @param {WebSocket} ws - The WebSocket instance.
   * @param {string} message - The WebSocket message.
   */
  static handleMessage(ws, message) {
    try {
      const { type, data } = JSON.parse(message);
      switch (type) {
        case 'connect':
          WebSocketUtils.handleConnect(ws, data);
          break;
        case 'data':
          WebSocketUtils.handleData(ws, data);
          break;
        default:
          console.error(`Unknown WebSocket message type: ${type}`);
      }
    } catch (error) {
      WebSocketUtils.handleError(ws, error);
    }
  }

  /**
   * Handle WebSocket connect messages.
   * @param {WebSocket} ws - The WebSocket instance.
   * @param {object} data - The connect data.
   */
  static async handleConnect(ws, data) {
    const { url, protocols } = data;
    const proxiedUrl = new URL(url);
    const targetWs = new WebSocket(proxiedUrl.href, protocols);

    targetWs.on('open', () => {
      ws.send(JSON.stringify({ type: 'connected' }));
    });

    targetWs.on('message', (message) => {
      ws.send(JSON.stringify({ type: 'data', data: message }));
    });

    targetWs.on('error', (error) => {
      WebSocketUtils.handleError(ws, error);
    });

    targetWs.on('close', () => {
      ws.close();
    });

    ws.targetWs = targetWs;
  }

  /**
   * Handle WebSocket data messages.
   * @param {WebSocket} ws - The WebSocket instance.
   * @param {string} data - The WebSocket data.
   */
  static handleData(ws, data) {
    if (ws.targetWs) {
      ws.targetWs.send(data);
    }
  }

  /**
   * Handle WebSocket errors.
   * @param {WebSocket} ws - The WebSocket instance.
   * @param {Error} error - The WebSocket error.
   */
  static handleError(ws, error) {
    console.error(`WebSocket error: ${error.message}`);
    ws.close();
  }

  /**
   * Handle WebSocket close events.
   * @param {WebSocket} ws - The WebSocket instance.
   */
  static handleClose(ws) {
    if (ws.targetWs) {
      ws.targetWs.close();
    }
  }
}

module.exports = WebSocketUtils;