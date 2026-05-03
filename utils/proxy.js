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
            const scrubbedData = WebRTCUtils.scrubIceCandidate(data);
            proxiedWs.send(JSON.stringify(scrubbedData));
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
    const encodedUrl = EncodingUtils.encodeUrl(url, process.env.SALT);
    return `https://${process.env.HOST}/proxy/${encodedUrl}`;
  }

  /**
   * Rewrite headers for a proxied request.
   * @param {object} headers - The headers to rewrite.
   * @returns {object} The rewritten headers.
   */
  static rewriteHeaders(headers) {
    const rewrittenHeaders = {};

    // Remove sensitive headers
    for (const key in headers) {
      if (key.toLowerCase() !== 'origin' && key.toLowerCase() !== 'referer') {
        rewrittenHeaders[key] = headers[key];
      }
    }

    // Rewrite Cookie header to isolate cookies per proxied origin
    if (headers.cookie) {
      const cookieHeader = headers.cookie;
      const rewrittenCookieHeader = CookieScopingUtils.isolateCookies(cookieHeader);
      rewrittenHeaders.cookie = rewrittenCookieHeader;
    }

    return rewrittenHeaders;
  }

  /**
   * Handle HTTPS tunnel integration.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleHttpsTunnel(req, res) {
    const { headers, url } = req;

    // Handle CONNECT request
    if (req.method === 'CONNECT') {
      const destination = new URL(`https://${headers.host}`);
      const destinationSocket = require('net').connect(destination.port, destination.hostname);

      res.writeHead(200, 'Connection established');
      res.flushHeaders();

      req.on('data', (chunk) => {
        destinationSocket.write(chunk);
      });

      destinationSocket.on('data', (chunk) => {
        res.write(chunk);
      });

      destinationSocket.on('end', () => {
        res.end();
      });

      req.on('end', () => {
        destinationSocket.end();
      });
    } else {
      // Handle other requests
      const proxiedUrl = ProxyUtils.getProxiedUrl(url);
      const destination = new URL(proxiedUrl);

      const options = {
        method: req.method,
        headers: ProxyUtils.rewriteHeaders(headers),
        hostname: destination.hostname,
        port: destination.port,
        path: destination.pathname,
      };

      const proxyReq = require('http').request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });

      req.pipe(proxyReq);
    }
  }

  /**
   * Cache proxied responses with TTL headers.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static cacheResponse(req, res) {
    const { headers, url } = req;

    // Cache response with TTL header
    const ttl = parseInt(headers['cache-control'].split(',').find((directive) => directive.trim().startsWith('max-age=')).trim().split('=')[1], 10);
    if (ttl > 0) {
      CacheUtils.cache.put(url, res, ttl);
    }
  }
}

module.exports = ProxyUtils;