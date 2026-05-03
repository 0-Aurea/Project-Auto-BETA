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
          if (data.type === 'iceCandidate') {
            const scrubbedCandidate = WebRTCUtils.scrubIceCandidate(data.candidate);
            data.candidate = scrubbedCandidate;
            proxiedWs.send(JSON.stringify(data));
          } else {
            ws.send(message);
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
    // Implement XOR + base64 URL encoding with a rotating salt
    const encodedUrl = EncodingUtils.encodeUrl(url, ' rotating-salt ');
    return `/proxy/${encodedUrl}`;
  }

  /**
   * Rewrite headers for a proxied request.
   * @param {object} headers - The headers to rewrite.
   * @returns {object} The rewritten headers.
   */
  static rewriteHeaders(headers) {
    // Implement full request/response header rewriting
    // Strip CSP, HSTS, X-Frame-Options, and other restrictive headers
    const rewrittenHeaders = { ...headers };
    delete rewrittenHeaders['content-security-policy'];
    delete rewrittenHeaders['strict-transport-security'];
    delete rewrittenHeaders['x-frame-options'];
    return rewrittenHeaders;
  }

  /**
   * Handle WebSocket upgrade requests.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleWebSocketUpgrade(req, res) {
    // Implement WebSocket upgrade proxying
    const { headers, url } = req;
    const proxiedUrl = ProxyUtils.getProxiedUrl(url);
    const destination = new URL(proxiedUrl);
    const destinationHeaders = ProxyUtils.rewriteHeaders(headers);

    // Establish connection to the proxied WebSocket server
    const proxiedWs = new WebSocket(destination.href, {
      headers: destinationHeaders,
      perMessageDeflate: false,
    });

    // Handle WebSocket upgrade response
    res.writeHead(101, {
      'Upgrade': 'WebSocket',
      'Connection': 'Upgrade',
      ...destinationHeaders,
    });
    res.end();

    // Handle WebSocket messages
    proxiedWs.on('message', (message) => {
      try {
        res.socket.send(message);
      } catch (error) {
        console.error('Error sending message to WebSocket client:', error);
        proxiedWs.close();
      }
    });

    // Handle WebSocket errors
    proxiedWs.on('error', (error) => {
      console.error('WebSocket proxied server error:', error);
      proxiedWs.close();
    });

    // Handle WebSocket close event
    proxiedWs.on('close', () => {
      res.socket.close();
    });
  }

  /**
   * Handle HTTPS tunnel requests.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleHttpsTunnel(req, res) {
    // Implement integrated HTTPS tunnel
    // No separate bare-server process needed
    const { headers, url } = req;
    const proxiedUrl = ProxyUtils.getProxiedUrl(url);
    const destination = new URL(proxiedUrl);

    // Establish connection to the proxied server
    const options = {
      hostname: destination.hostname,
      port: destination.port,
      path: destination.pathname,
      method: req.method,
      headers: ProxyUtils.rewriteHeaders(headers),
    };
    const proxiedReq = require('https').request(options, (proxiedRes) => {
      res.writeHead(proxiedRes.statusCode, proxiedRes.headers);
      proxiedRes.pipe(res);
    });

    // Handle request body
    req.pipe(proxiedReq);

    // Handle errors
    proxiedReq.on('error', (error) => {
      console.error('Error handling HTTPS tunnel request:', error);
      res.statusCode = 500;
      res.end();
    });
  }
}

module.exports = ProxyUtils;