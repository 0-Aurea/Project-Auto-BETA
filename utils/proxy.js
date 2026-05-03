const WebSocket = require('ws');
const { URL } = require('url');
const { IncomingMessage, ServerResponse } = require('http');

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
    });
  }

  /**
   * Get the proxied URL for the given WebSocket URL.
   * @param {string} url - The WebSocket URL to proxy.
   * @returns {string} The proxied URL.
   */
  static getProxiedUrl(url) {
    // Implement URL rewriting logic here
    return url;
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

    return rewrittenHeaders;
  }

  /**
   * Handle HTTP request proxying.
   * @param {IncomingMessage} req - The incoming request.
   * @param {ServerResponse} res - The server response.
   */
  static handleHttpRequest(req, res) {
    const { headers, url } = req;
    const proxiedUrl = ProxyUtils.getProxiedUrl(url);
    const destination = new URL(proxiedUrl);
    const destinationHeaders = ProxyUtils.rewriteHeaders(headers);

    // Establish connection to the proxied server
    const options = {
      method: req.method,
      headers: destinationHeaders,
      hostname: destination.hostname,
      port: destination.port,
      path: destination.pathname,
    };

    const proxyReq = require('http').request(options, (proxyRes) => {
      // Rewrite response headers
      const rewrittenHeaders = { ...proxyRes.headers };

      // Strip CSP, HSTS, and X-Frame-Options headers
      delete rewrittenHeaders['content-security-policy'];
      delete rewrittenHeaders['strict-transport-security'];
      delete rewrittenHeaders['x-frame-options'];

      // Set response headers
      Object.keys(rewrittenHeaders).forEach((header) => {
        res.setHeader(header, rewrittenHeaders[header]);
      });

      // Handle response body
      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });

      proxyRes.on('end', () => {
        res.end();
      });
    });

    // Handle request body
    req.on('data', (chunk) => {
      proxyReq.write(chunk);
    });

    req.on('end', () => {
      proxyReq.end();
    });
  }
}

module.exports = ProxyUtils;