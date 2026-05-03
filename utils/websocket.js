const WebSocket = require('ws');
const { URL } = require('url');
const { IncomingMessage, ServerResponse } = require('http');
const { EncodingUtils } = require('./encoding');
const { HeaderRewriterUtils } = require('./headerRewriter');

/**
 * WebSocket utility class for managing WebSocket upgrade proxying with header rewriting.
 */
class WebSocketUtils {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Initialize the WebSocket server.
   * @param {Server} server - The HTTP server instance.
   */
  static init(server) {
    WebSocketUtils.wss = new WebSocket.Server({ server, noServer: true });

    WebSocketUtils.wss.on('connection', (ws, req) => {
      const { headers, url } = req;
      const { host, origin } = headers;

      // Handle WebSocket upgrade request
      const websocketUrl = new URL(url, `ws://${host}`);
      const targetHost = websocketUrl.host;
      const targetPath = websocketUrl.pathname;
      const targetParams = websocketUrl.search;

      // Establish connection to target WebSocket server
      const targetWs = new WebSocket(`ws://${targetHost}${targetPath}${targetParams}`);

      // Handle messages from client
      ws.on('message', (message) => {
        targetWs.send(message);
      });

      // Handle errors from client
      ws.on('error', (error) => {
        targetWs.terminate();
      });

      // Handle close from client
      ws.on('close', () => {
        targetWs.terminate();
      });

      // Handle messages from target server
      targetWs.on('message', (message) => {
        ws.send(message);
      });

      // Handle errors from target server
      targetWs.on('error', (error) => {
        ws.terminate();
      });

      // Handle close from target server
      targetWs.on('close', () => {
        ws.terminate();
      });

      // Rewrite WebSocket headers
      const rewrittenHeaders = HeaderRewriterUtils.rewriteResponseHeaders({
        ...headers,
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
      });

      // Send rewritten headers to client
      ws.send(JSON.stringify({
        type: 'headers',
        headers: rewrittenHeaders,
      }));
    });
  }

  /**
   * Handle WebSocket upgrade request.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleUpgrade(req, res) {
    const { headers, url } = req;
    const { host, origin } = headers;

    // Check if request is a WebSocket upgrade request
    if (headers['upgrade'] === 'websocket') {
      // Handle WebSocket upgrade
      WebSocketUtils.wss.handleUpgrade(req, res, (ws) => {
        WebSocketUtils.wss.emit('connection', ws, req);
      });
    } else {
      // Handle non-WebSocket request
      res.writeHead(400);
      res.end('Bad Request');
    }
  }

  /**
   * Proxy WebSocket connection to target server.
   * @param {WebSocket} ws - The client WebSocket instance.
   * @param {string} targetUrl - The URL of the target WebSocket server.
   */
  static proxyWebSocket(ws, targetUrl) {
    const targetWs = new WebSocket(targetUrl);

    ws.on('message', (message) => {
      targetWs.send(message);
    });

    ws.on('error', (error) => {
      targetWs.terminate();
    });

    ws.on('close', () => {
      targetWs.terminate();
    });

    targetWs.on('message', (message) => {
      ws.send(message);
    });

    targetWs.on('error', (error) => {
      ws.terminate();
    });

    targetWs.on('close', () => {
      ws.terminate();
    });
  }

  /**
   * Rewrite WebSocket headers to prevent IP leaks.
   * @param {object} headers - The WebSocket headers to rewrite.
   * @returns {object} The rewritten WebSocket headers.
   */
  static rewriteWebSocketHeaders(headers) {
    const rewrittenHeaders = { ...headers };

    // Remove sensitive headers
    delete rewrittenHeaders['X-Forwarded-For'];
    delete rewrittenHeaders['X-Real-IP'];

    // Rewrite Origin header
    rewrittenHeaders['Origin'] = rewrittenHeaders['Origin'].replace('http://', 'ws://').replace('https://', 'wss://');

    return rewrittenHeaders;
  }
}

module.exports = WebSocketUtils;