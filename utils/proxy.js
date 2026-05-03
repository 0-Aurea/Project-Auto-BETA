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

      // Handle WebRTC ICE candidate scrubbing
      proxiedWs.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'candidate') {
            const scrubbedMessage = ProxyUtils.scrubWebRTCIceCandidate(data);
            proxiedWs.send(JSON.stringify(scrubbedMessage));
          } else {
            proxiedWs.send(message);
          }
        } catch (error) {
          console.error('Error handling WebRTC ICE candidate:', error);
          ws.terminate();
          proxiedWs.close();
        }
      });
    });
  }

  /**
   * Get the proxied URL for a given URL.
   * @param {string} url - The URL to proxy.
   * @returns {string} The proxied URL.
   */
  static getProxiedUrl(url) {
    const encodedUrl = EncodingUtils.encodeUrl(url, EncodingUtils.getSalt());
    return `/proxy/${encodedUrl}`;
  }

  /**
   * Rewrite headers for a proxied request.
   * @param {object} headers - The headers to rewrite.
   * @returns {object} The rewritten headers.
   */
  static rewriteHeaders(headers) {
    const rewrittenHeaders = { ...headers };

    // Remove sensitive headers
    delete rewrittenHeaders['sec-websocket-origin'];
    delete rewrittenHeaders['sec-websocket-protocol'];

    // Rewrite WebSocket upgrade headers
    rewrittenHeaders['upgrade'] = 'websocket';
    rewrittenHeaders['connection'] = 'upgrade';

    return rewrittenHeaders;
  }

  /**
   * Scrub WebRTC ICE candidate IP addresses.
   * @param {object} candidate - The ICE candidate to scrub.
   * @returns {object} The scrubbed ICE candidate.
   */
  static scrubWebRTCIceCandidate(candidate) {
    const scrubbedCandidate = { ...candidate };
    scrubbedCandidate.candidate = WebRTCUtils.scrubIPAddr(scrubbedCandidate.candidate);
    return scrubbedCandidate;
  }

  /**
   * Handle WebSocket errors.
   * @param {Error} error - The error to handle.
   */
  static handleWebSocketError(error) {
    console.error('WebSocket error:', error);
  }
}

module.exports = { ProxyUtils };