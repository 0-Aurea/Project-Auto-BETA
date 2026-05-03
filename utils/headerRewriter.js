const { URL } = require('url');

/**
 * Header rewriter utility class for managing request and response header rewriting.
 */
class HeaderRewriterUtils {
  /**
   * Regular expression to match hop-by-hop headers.
   */
  static HOP_BY_HOP_HEADERS_REGEX = /(?:connection|keep-alive|proxy-authenticate|proxy-authorization|te|trailers|transfer-encoding|upgrade|via|warning)\b/i;

  /**
   * Regular expression to match sensitive headers.
   */
  static SENSITIVE_HEADERS_REGEX = /(?:set-cookie|cookie|authorization|www-authenticate)\b/i;

  /**
   * Rewrites response headers to ensure optimal anonymity.
   * @param {ServerResponse} response - The response object.
   */
  static rewriteResponseHeaders(response) {
    // Remove hop-by-hop headers
    response.headers = Object.fromEntries(Object.entries(response.headers).filter(([key]) => !HeaderRewriterUtils.HOP_BY_HOP_HEADERS_REGEX.test(key)));

    // Remove sensitive headers
    response.headers = Object.fromEntries(Object.entries(response.headers).filter(([key]) => !HeaderRewriterUtils.SENSITIVE_HEADERS_REGEX.test(key)));

    // Strip CSP and HSTS headers
    response.headers['content-security-policy'] = '';
    response.headers['strict-transport-security'] = '';

    // Disable caching
    response.headers['cache-control'] = 'no-cache, no-store, must-revalidate';

    // Disable frame busting
    response.headers['x-frame-options'] = '';

    // Disable MIME-sniffing
    response.headers['x-content-type-options'] = 'nosniff';
  }

  /**
   * Rewrites request headers to ensure optimal anonymity.
   * @param {IncomingMessage} request - The request object.
   */
  static rewriteRequestHeaders(request) {
    // Remove sensitive headers
    request.headers = Object.fromEntries(Object.entries(request.headers).filter(([key]) => !HeaderRewriterUtils.SENSITIVE_HEADERS_REGEX.test(key)));

    // Remove referer header
    delete request.headers.referer;

  }

  /**
   * Rewrites WebSocket upgrade headers.
   * @param {Object} headers - The WebSocket upgrade headers.
   */
  static rewriteWebSocketHeaders(headers) {
    // Remove hop-by-hop headers
    headers = Object.fromEntries(Object.entries(headers).filter(([key]) => !HeaderRewriterUtils.HOP_BY_HOP_HEADERS_REGEX.test(key)));

    // Remove sensitive headers
    headers = Object.fromEntries(Object.entries(headers).filter(([key]) => !HeaderRewriterUtils.SENSITIVE_HEADERS_REGEX.test(key)));
  }
}

module.exports = { HeaderRewriterUtils };