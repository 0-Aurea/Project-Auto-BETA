const WebSocket = require('ws');
const { URL } = require('url');
const { IncomingMessage, ServerResponse } = require('http');
const { EncodingUtils } = require('./encoding');
const { CacheUtils } = require('./cache');
const { CookieScopingUtils } = require('./cookieScoping');
const { WebRTCUtils } = require('./webrtc');

/**
 * Proxy utility class for managing full request/response header rewriting,
 * WebSocket upgrade proxying, and HTTPS tunnel integration.
 */
class ProxyUtils {
  /**
   * WebSocket server instance.
   */
  static wss;

  /**
   * Initialize the WebSocket server.
   * @param {Server} server - The HTTP server instance.
   */
  static init(server) {
    ProxyUtils.wss = new WebSocket.Server({ server, perMessageDeflate: false });

    ProxyUtils.wss.on('connection', (ws, req) => {
      const { headers, url } = req;

      // Handle WebSocket upgrade request
      const proxiedUrl = ProxyUtils.getProxiedUrl(url);
      const destination = new URL(proxiedUrl);
      const destinationHeaders = ProxyUtils.rewriteHeaders(headers);

      // Establish connection to the proxied WebSocket server
      const proxiedWs = new WebSocket(destination.href, {
        headers: destinationHeaders,
        perMessageDeflate: false,
      });

      // Handle messages from the client
      ws.on('message', (message) => {
        try {
          proxiedWs.send(message);
        } catch (error) {
          console.error('Error sending message to proxied WebSocket server:', error);
          ws.terminate();
          proxiedWs.close();
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
        ws.terminate();
        proxiedWs.close();
      });

      // Handle close event
      ws.on('close', () => {
        proxiedWs.close();
      });

      // Handle messages from the proxied WebSocket server
      proxiedWs.on('message', (message) => {
        try {
          ws.send(message);
        } catch (error) {
          console.error('Error sending message to WebSocket client:', error);
          ws.terminate();
          proxiedWs.close();
        }
      });

      // Handle errors
      proxiedWs.on('error', (error) => {
        console.error('WebSocket proxied server error:', error);
        ws.terminate();
        proxiedWs.close();
      });

      // Handle close event
      proxiedWs.on('close', () => {
        ws.close();
      });

      // Handle WebSocket ping
      ws.on('ping', () => {
        try {
          proxiedWs.ping();
        } catch (error) {
          console.error('Error sending ping to proxied WebSocket server:', error);
          ws.terminate();
          proxiedWs.close();
        }
      });

      // Handle WebSocket pong
      ws.on('pong', () => {
        // No-op
      });

      // Set up connection timeout
      let timeoutId = setTimeout(() => {
        ws.terminate();
        proxiedWs.close();
      }, 60000); // 1 minute

      // Reset timeout on message
      ws.on('message', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          ws.terminate();
          proxiedWs.close();
        }, 60000);
      });

      // Reset timeout on proxied message
      proxiedWs.on('message', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          ws.terminate();
          proxiedWs.close();
        }, 60000);
      });
    });
  }

  /**
   * Get the proxied URL for the given WebSocket URL.
   * @param {string} url - The WebSocket URL to proxy.
   * @returns {string} The proxied URL.
   */
  static getProxiedUrl(url) {
    const salt = EncodingUtils.getSalt();
    const encodedUrl = EncodingUtils.encodeUrl(url, salt);
    return `ws://${encodedUrl}`;
  }

  /**
   * Rewrite headers for the proxied request.
   * @param {object} headers - The original headers.
   * @returns {object} The rewritten headers.
   */
  static rewriteHeaders(headers) {
    const rewrittenHeaders = { ...headers };

    // Remove sensitive headers
    delete rewrittenHeaders['sec-websocket-protocol'];
    delete rewrittenHeaders['sec-websocket-extensions'];

    // Rewrite origin header
    rewrittenHeaders['origin'] = 'https://' + new URL(headers['origin']).hostname;

    return rewrittenHeaders;
  }

  /**
   * Handle WebSocket upgrade request and establish a proxied connection.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleWebSocketUpgrade(req, res) {
    const { headers, url } = req;

    // Check if the request is a WebSocket upgrade request
    if (headers['upgrade'] === 'websocket') {
      // Handle WebSocket upgrade
      ProxyUtils.wss.handleUpgrade(req, res, (ws) => {
        ProxyUtils.wss.emit('connection', ws, req);
      });
    } else {
      // Handle other requests
      res.writeHead(400);
      res.end('Bad Request');
    }
  }
}

module.exports = { ProxyUtils };