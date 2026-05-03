const WebSocket = require('ws');
const { URL } = require('url');
const { IncomingMessage, ServerResponse } = require('http');
const { ProxyUtils } = require('./proxy');

/**
 * WebSocket utility class for managing WebSocket upgrade proxying and header rewriting.
 */
class WebSocketUtils {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Initialize the WebSocket server.
   * @param {Server} server - The HTTP server instance.
   * @param {Object} options - WebSocket server options.
   * @param {string} options.host - WebSocket server host.
   * @param {number} options.port - WebSocket server port.
   */
  static init(server, options) {
    WebSocketUtils.wss = new WebSocket.Server({ server, ...options });

    WebSocketUtils.wss.on('connection', (ws, req) => {
      const { headers, url } = req;
      const { upgrade, ...rest } = headers;

      if (upgrade === 'websocket') {
        const targetUrl = new URL(url, 'http://example.com');
        const targetWs = new WebSocket(targetUrl.href);

        // Rewrite WebSocket headers
        const rewrittenHeaders = { ...rest };
        rewrittenHeaders['sec-websocket-protocol'] = headers['sec-websocket-protocol'];
        rewrittenHeaders['sec-websocket-version'] = headers['sec-websocket-version'];

        // Establish the WebSocket connection
        targetWs.on('open', () => {
          ws.on('message', (message) => {
            try {
              targetWs.send(message);
            } catch (error) {
              console.error('Error sending message to target WebSocket:', error);
              ws.close();
            }
          });

          targetWs.on('message', (message) => {
            try {
              ws.send(message);
            } catch (error) {
              console.error('Error sending message to client WebSocket:', error);
              targetWs.close();
            }
          });

          targetWs.on('close', () => {
            try {
              ws.close();
            } catch (error) {
              console.error('Error closing client WebSocket:', error);
            }
          });

          targetWs.on('error', (error) => {
            console.error('Target WebSocket error:', error);
            try {
              ws.close();
            } catch (error) {
              console.error('Error closing client WebSocket:', error);
            }
          });
        });

        ws.on('close', () => {
          try {
            targetWs.close();
          } catch (error) {
            console.error('Error closing target WebSocket:', error);
          }
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          try {
            targetWs.close();
          } catch (error) {
            console.error('Error closing target WebSocket:', error);
          }
        });
      }
    });
  }

  /**
   * Handle WebSocket upgrade requests.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleUpgrade(req, res) {
    const { headers, url } = req;

    if (headers.upgrade === 'websocket') {
      WebSocketUtils.wss.handleUpgrade(req, res, (ws) => {
        WebSocketUtils.wss.emit('connection', ws, req);
      });
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
    }
  }

  /**
   * Proxy WebSocket requests.
   * @param {string} targetUrl - The target URL for the WebSocket connection.
   * @param {Object} headers - The headers for the WebSocket connection.
   * @returns {Promise<WebSocket>} A promise resolving to the proxied WebSocket.
   */
  static async proxyWebSocket(targetUrl, headers) {
    return new Promise((resolve, reject) => {
      const targetWs = new WebSocket(targetUrl, headers);

      targetWs.on('open', () => {
        resolve(targetWs);
      });

      targetWs.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Rewrite WebSocket headers.
   * @param {Object} headers - The headers to rewrite.
   * @returns {Object} The rewritten headers.
   */
  static rewriteWebSocketHeaders(headers) {
    const rewrittenHeaders = { ...headers };

    // Remove sensitive headers
    delete rewrittenHeaders['sec-websocket-protocol'];
    delete rewrittenHeaders['sec-websocket-version'];

    return rewrittenHeaders;
  }
}

module.exports = { WebSocketUtils };