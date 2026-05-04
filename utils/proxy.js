const WebSocket = require('ws');
const { URL } = require('url');
const { IncomingMessage, ServerResponse } = require('http');
const { EncodingUtils } = require('./encoding');
const { CacheUtils } = require('./cache');
const { CookieScopingUtils } = require('./cookieScoping');
const { WebRTCUtils } = require('./webrtc');
const { JSRewriterUtils } = require('./jsRewriter');
const { CssRewriterUtils } = require('./cssRewriter');
const { HTMLRewriterUtils } = require('./htmlRewriter');
const { HeaderRewriterUtils } = require('./headerRewriter');

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
    });
  }

  /**
   * Get the proxied URL for a given URL.
   * @param {string} url - The URL to proxy.
   * @returns {string} The proxied URL.
   */
  static getProxiedUrl(url) {
    // Implement XOR + base64 URL encoding with a rotating salt
    const encodedUrl = EncodingUtils.encode(url);
    return `/proxy/${encodedUrl}`;
  }

  /**
   * Rewrite headers for a proxied request.
   * @param {object} headers - The headers to rewrite.
   * @returns {object} The rewritten headers.
   */
  static rewriteHeaders(headers) {
    // Implement header rewriting to strip CSP, HSTS, and X-Frame-Options headers
    const rewrittenHeaders = HeaderRewriterUtils.rewrite(headers);
    return rewrittenHeaders;
  }

  /**
   * Handle WebRTC ICE candidate scrubbing to prevent IP leaks.
   * @param {object} rtc - The WebRTC object.
   */
  static handleWebRTC(rtc) {
    // Implement WebRTC ICE candidate scrubbing
    WebRTCUtils.scrub(rtc);
  }

  /**
   * Handle WebSocket upgrade proxying with header rewriting.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleWebSocketUpgrade(req, res) {
    // Implement WebSocket upgrade proxying with header rewriting
    const { headers, url } = req;
    const proxiedUrl = ProxyUtils.getProxiedUrl(url);
    const destination = new URL(proxiedUrl);
    const destinationHeaders = ProxyUtils.rewriteHeaders(headers);

    // Establish connection to the proxied WebSocket server
    const proxiedWs = new WebSocket(destination.href, {
      headers: destinationHeaders,
      perMessageDeflate: false,
    });

    // Handle WebSocket connection
    proxiedWs.on('open', () => {
      res.writeHead(101, {
        'Upgrade': 'WebSocket',
        'Connection': 'Upgrade',
      });
      res.end();
    });

    // Handle messages from the client
    req.on('data', (message) => {
      try {
        proxiedWs.send(message);
      } catch (error) {
        console.error('Error sending message to proxied WebSocket server:', error);
        req.destroy();
        proxiedWs.close();
      }
    });

    // Handle errors
    req.on('error', (error) => {
      console.error('WebSocket client error:', error);
      req.destroy();
      proxiedWs.close();
    });

    // Handle close event
    req.on('close', () => {
      proxiedWs.close();
    });

    // Handle messages from the proxied WebSocket server
    proxiedWs.on('message', (message) => {
      try {
        res.write(message);
      } catch (error) {
        console.error('Error sending message to WebSocket client:', error);
        req.destroy();
        proxiedWs.close();
      }
    });

    // Handle errors
    proxiedWs.on('error', (error) => {
      console.error('WebSocket proxied server error:', error);
      req.destroy();
      proxiedWs.close();
    });

    // Handle close event
    proxiedWs.on('close', () => {
      req.destroy();
    });
  }
}

module.exports = ProxyUtils;