const { URL } = require('url');

/**
 * Header rewriting utility class for stripping CSP, HSTS, and X-Frame-Options headers.
 */
class HeaderRewriterUtils {
  /**
   * List of headers to strip for better compatibility.
   */
  static HEADERS_TO_STRIP = [
    'Content-Security-Policy',
    'Content-Security-Policy-Report-Only',
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
  ];

  /**
   * Regular expression to match header names.
   */
  static HEADER_NAME_REGEX = /^([A-Za-z-]+):/;

  /**
   * Rewrite response headers to strip CSP, HSTS, and X-Frame-Options headers.
   * @param {object} headers - The response headers to rewrite.
   * @returns {object} The rewritten response headers.
   */
  static rewriteResponseHeaders(headers) {
    const rewrittenHeaders = {};

    for (const [headerName, headerValue] of Object.entries(headers)) {
      if (!HeaderRewriterUtils.HEADERS_TO_STRIP.includes(headerName)) {
        rewrittenHeaders[headerName] = headerValue;
      }
    }

    return rewrittenHeaders;
  }

  /**
   * Rewrite request headers to remove sensitive information.
   * @param {object} headers - The request headers to rewrite.
   * @returns {object} The rewritten request headers.
   */
  static rewriteRequestHeaders(headers) {
    const rewrittenHeaders = {};

    for (const [headerName, headerValue] of Object.entries(headers)) {
      if (headerName.toLowerCase() !== 'referer') {
        rewrittenHeaders[headerName] = headerValue;
      } else {
        const refererUrl = new URL(headerValue);
        rewrittenHeaders[headerName] = `${refererUrl.protocol}//${refererUrl.host}`;
      }
    }

    return rewrittenHeaders;
  }

  /**
   * Handle WebSocket upgrade requests and responses.
   * @param {object} request - The WebSocket request object.
   * @param {object} response - The WebSocket response object.
   */
  static handleWebSocketUpgrade(request, response) {
    // Rewrite WebSocket upgrade request headers
    request.headers = HeaderRewriterUtils.rewriteRequestHeaders(request.headers);

    // Rewrite WebSocket upgrade response headers
    response.headers = HeaderRewriterUtils.rewriteResponseHeaders(response.headers);

    // Handle WebSocket connection
    return new Promise((resolve, reject) => {
      // Establish WebSocket connection
      const webSocket = new globalThis.WebSocket(request.url);

      // Handle WebSocket messages
      webSocket.onmessage = (event) => {
        // Rewrite WebSocket message headers
        const messageHeaders = HeaderRewriterUtils.rewriteRequestHeaders(event.data.headers);

        // Send rewritten message
        webSocket.send(JSON.stringify({ ...event.data, headers: messageHeaders }));
      };

      // Handle WebSocket errors
      webSocket.onerror = (event) => {
        reject(event);
      };

      // Handle WebSocket close
      webSocket.onclose = () => {
        resolve();
      };
    });
  }

  /**
   * Strip sensitive headers from a response object.
   * @param {object} response - The response object to strip headers from.
   * @returns {object} The response object with sensitive headers stripped.
   */
  static stripSensitiveHeaders(response) {
    if (response.headers) {
      response.headers = HeaderRewriterUtils.rewriteResponseHeaders(response.headers);
    }

    return response;
  }
}

module.exports = HeaderRewriterUtils;