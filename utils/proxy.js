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
    ProxyUtils.wss = new WebSocket.Server({ server });

    ProxyUtils.wss.on('connection', (ws, req) => {
      const { headers, url } = req;

      // Handle WebSocket upgrade request
      const proxiedUrl = ProxyUtils.getProxiedUrl(url);
      const destination = new URL(proxiedUrl);
      const destinationHeaders = ProxyUtils.rewriteHeaders(headers);

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

      // Handle WebSocket ping
      ws.on('ping', () => {
        proxiedWs.ping();
      });

      // Handle WebSocket pong
      ws.on('pong', () => {
        // No-op
      });

      // Set up connection timeout
      let timeoutId = setTimeout(() => {
        ws.terminate();
        proxiedWs.close();
      }, 30000); // 30 seconds

      // Reset timeout on message
      ws.on('message', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          ws.terminate();
          proxiedWs.close();
        }, 30000);
      });

      // Reset timeout on proxied message
      proxiedWs.on('message', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          ws.terminate();
          proxiedWs.close();
        }, 30000);
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
    return `/${encodedUrl}`;
  }

  /**
   * Rewrite headers for the proxied request.
   * @param {object} headers - The original headers.
   * @returns {object} The rewritten headers.
   */
  static rewriteHeaders(headers) {
    const rewrittenHeaders = {};

    // Remove hop-by-hop headers
    const hopByHopHeaders = ['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailers', 'transfer-encoding', 'upgrade'];
    for (const header in headers) {
      if (!hopByHopHeaders.includes(header.toLowerCase())) {
        rewrittenHeaders[header] = headers[header];
      }
    }

    // Rewrite Cookie header to isolate cookies per proxied origin
    if (headers.cookie) {
      const requestUrl = headers['x-request-url'];
      const isolatedCookies = CookieScopingUtils.isolateCookies(requestUrl, headers.cookie);
      rewrittenHeaders.cookie = isolatedCookies;
    }

    // Add X-Forwarded-For header
    rewrittenHeaders['x-forwarded-for'] = headers['x-forwarded-for'] || '127.0.0.1';

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
      // Handle WebSocket upgrade request
      ProxyUtils.wss.handleUpgrade(req, res, (ws) => {
        ProxyUtils.wss.emit('connection', ws, req);
      });
    } else {
      // Handle non-WebSocket requests
      res.writeHead(400);
      res.end('Bad Request');
    }
  }

  /**
   * Scrub IP addresses from WebRTC ICE candidate strings.
   * @param {string} candidate - The ICE candidate string to scrub.
   * @returns {string} The scrubbed ICE candidate string.
   */
  static scrubIceCandidate(candidate) {
    return WebRTCUtils.scrubIPAddresses(candidate);
  }
}

module.exports = { ProxyUtils };