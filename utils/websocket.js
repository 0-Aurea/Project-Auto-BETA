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
   */
  static init(server) {
    WebSocketUtils.wss = new WebSocket.Server({ server });

    WebSocketUtils.wss.on('connection', (ws, req) => {
      const { headers, url } = req;
      const { upgrade, ...rest } = headers;

      if (upgrade === 'websocket') {
        const targetUrl = new URL(url, 'http://example.com');
        const targetWs = new WebSocket(targetUrl.href);

        targetWs.on('open', () => {
          ws.on('message', (message) => {
            targetWs.send(message);
          });

          targetWs.on('message', (message) => {
            ws.send(message);
          });

          targetWs.on('close', () => {
            ws.close();
          });

          targetWs.on('error', (error) => {
            console.error('Target WebSocket error:', error);
            ws.close();
          });
        });

        ws.on('close', () => {
          targetWs.close();
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          targetWs.close();
        });

        // Rewrite WebSocket headers
        const rewrittenHeaders = { ...rest };
        rewrittenHeaders['sec-websocket-protocol'] = headers['sec-websocket-protocol'];
        rewrittenHeaders['sec-websocket-version'] = headers['sec-websocket-version'];

        // Establish the WebSocket connection
        targetWs.on('open', () => {
          targetWs.send(JSON.stringify({ type: 'connection-established' }));
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
}

module.exports = { WebSocketUtils };