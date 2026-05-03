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
          const messageData = JSON.parse(message);
          if (messageData.type === 'iceCandidate') {
            const scrubbedMessage = WebRTCUtils.scrubIceCandidate(messageData);
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
    // Implement XOR + base64 URL encoding with a rotating salt
    const encodedUrl = EncodingUtils.encodeUrl(url);
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
   * Handle a proxied request.
   * @param {IncomingMessage} req - The proxied request.
   * @param {ServerResponse} res - The response to send back to the client.
   */
  static handleProxiedRequest(req, res) {
    // Implement request/response caching with TTL headers
    const cacheKey = req.url;
    const cachedResponse = CacheUtils.get(cacheKey);
    if (cachedResponse) {
      res.writeHead(cachedResponse.status, cachedResponse.headers);
      res.end(cachedResponse.body);
    } else {
      // Forward the request to the proxied server
      const proxiedReq = EncodingUtils.getProxiedRequest(req);
      const proxiedRes = EncodingUtils.getProxiedResponse(res);

      // Handle dynamic JS imports, eval(), and WebSocket upgrades
      if (proxiedReq.headers['upgrade'] === 'websocket') {
        // Handle WebSocket upgrade request
        ProxyUtils.handleWebSocketUpgrade(proxiedReq, proxiedRes);
      } else {
        // Handle HTTP request
        const response = EncodingUtils.forwardRequest(proxiedReq);
        response.then((response) => {
          // Rewrite the response headers and body
          const rewrittenResponse = ProxyUtils.rewriteResponse(response);
          res.writeHead(rewrittenResponse.status, rewrittenResponse.headers);
          res.end(rewrittenResponse.body);

          // Cache the response
          CacheUtils.set(cacheKey, rewrittenResponse);
        }).catch((error) => {
          console.error('Error handling proxied request:', error);
          res.writeHead(500);
          res.end('Internal Server Error');
        });
      }
    }
  }

  /**
   * Rewrite a response.
   * @param {ServerResponse} response - The response to rewrite.
   * @returns {ServerResponse} The rewritten response.
   */
  static rewriteResponse(response) {
    // Implement response rewriting
    // Handle HTML, JS, and CSS rewriting
    const rewrittenResponse = { ...response };
    rewrittenResponse.headers['content-type'] = 'text/html; charset=UTF-8';

    // Handle HTML rewriting
    if (response.headers['content-type'] === 'text/html') {
      const htmlRewriter = new HTMLRewriterUtils();
      rewrittenResponse.body = htmlRewriter.rewrite(response.body);
    }

    // Handle JS rewriting
    if (response.headers['content-type'] === 'application/javascript') {
      const jsRewriter = new JSRewriterUtils();
      rewrittenResponse.body = jsRewriter.rewrite(response.body);
    }

    // Handle CSS rewriting
    if (response.headers['content-type'] === 'text/css') {
      const cssRewriter = new CssRewriterUtils();
      rewrittenResponse.body = cssRewriter.rewrite(response.body);
    }

    return rewrittenResponse;
  }

  /**
   * Handle a WebSocket upgrade request.
   * @param {IncomingMessage} req - The WebSocket upgrade request.
   * @param {ServerResponse} res - The response to send back to the client.
   */
  static handleWebSocketUpgrade(req, res) {
    // Implement WebSocket upgrade proxying
    const ws = new WebSocket(req.url);
    req.on('data', (data) => {
      ws.send(data);
    });
    ws.on('data', (data) => {
      res.write(data);
    });
  }
}

module.exports = ProxyUtils;