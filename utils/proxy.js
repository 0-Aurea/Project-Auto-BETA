const WebSocket = require('ws');
const { URL } = require('url');
const { IncomingMessage, ServerResponse } = require('http');
const { EncodingUtils } = require('./encoding');
const { CacheUtils } = require('./cache');

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
    const encodedUrl = EncodingUtils.encode(url, salt);
    return `/${encodedUrl}`;
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
    delete rewrittenHeaders['sec-websocket-version'];

    // Strip CSP, HSTS, and X-Frame-Options headers
    delete rewrittenHeaders['content-security-policy'];
    delete rewrittenHeaders['strict-transport-security'];
    delete rewrittenHeaders['x-frame-options'];

    // Rewrite Cookie header to isolate cookies per proxied origin
    if (rewrittenHeaders.cookie) {
      const cookies = rewrittenHeaders.cookie.split(';');
      rewrittenHeaders.cookie = cookies
        .filter((cookie) => !cookie.trim().startsWith('__Secure-'))
        .join(';');
    }

    // Add cache-control header to prevent caching
    rewrittenHeaders['cache-control'] = 'no-cache, no-store, must-revalidate';

    return rewrittenHeaders;
  }

  /**
   * Handle HTTP request proxying.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   * @returns {Promise<void>}
   */
  static async handleRequest(req, res) {
    const { headers, url, method } = req;

    // Get the proxied URL
    const proxiedUrl = ProxyUtils.getProxiedUrl(url);

    // Create a new request to the proxied server
    const proxiedReq = {
      method,
      headers: ProxyUtils.rewriteHeaders(headers),
      url: proxiedUrl,
    };

    // Pipe the request body
    const { readable, writable } = new Duplex();
    req.pipe(readable);
    writable.pipe(res);

    // Handle the response
    const proxiedRes = await fetch(proxiedUrl, proxiedReq);
    const { status, statusText, headers: proxiedHeaders } = proxiedRes;

    // Rewrite the response headers
    const rewrittenHeaders = { ...proxiedHeaders };
    delete rewrittenHeaders['transfer-encoding'];

    // Send the response
    res.writeHead(status, rewrittenHeaders);
    res.end(await proxiedRes.arrayBuffer());
  }
}

module.exports = { ProxyUtils };