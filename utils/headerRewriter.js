const { URL } = require('url');

/**
 * Header rewriting utility class for stripping CSP, HSTS, and X-Frame-Options headers.
 */
class HeaderRewriterUtils {
  /**
   * List of headers to strip for better compatibility.
   */
  static HEADERS_TO_STRIP = [
    'content-security-policy',
    'content-security-policy-report-only',
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
  ];

  /**
   * Rewrite response headers to strip CSP, HSTS, and X-Frame-Options headers.
   * @param {object} headers - The response headers to rewrite.
   * @returns {object} The rewritten response headers.
   */
  static rewriteResponseHeaders(headers) {
    const rewrittenHeaders = {};

    for (const [headerName, headerValue] of Object.entries(headers)) {
      if (!HeaderRewriterUtils.HEADERS_TO_STRIP.includes(headerName.toLowerCase())) {
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
        try {
          const refererUrl = new URL(headerValue);
          rewrittenHeaders[headerName] = `${refererUrl.protocol}//${refererUrl.host}`;
        } catch (error) {
          rewrittenHeaders[headerName] = headerValue;
        }
      }
    }

    return rewrittenHeaders;
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

  /**
   * Rewrite Location header to ensure correct redirect URL.
   * @param {object} headers - The response headers to rewrite.
   * @param {string} baseUrl - The base URL for rewriting.
   * @returns {object} The rewritten response headers.
   */
  static rewriteLocationHeader(headers, baseUrl) {
    if (headers.location) {
      try {
        const locationUrl = new URL(headers.location, baseUrl);
        headers.location = locationUrl.href;
      } catch (error) {
        // Handle invalid URL
      }
    }

    return headers;
  }

  /**
   * Rewrite Set-Cookie header to ensure correct domain and path.
   * @param {object} headers - The response headers to rewrite.
   * @param {string} baseUrl - The base URL for rewriting.
   * @returns {object} The rewritten response headers.
   */
  static rewriteSetCookieHeader(headers, baseUrl) {
    if (headers['set-cookie']) {
      const setCookieValues = headers['set-cookie'];
      const rewrittenSetCookieValues = [];

      for (const setCookieValue of setCookieValues) {
        try {
          const cookieParts = setCookieValue.split(';');
          const cookieValue = cookieParts[0].trim();
          const cookieOptions = cookieParts.slice(1).map((part) => part.trim());

          const rewrittenCookieOptions = [];

          for (const cookieOption of cookieOptions) {
            if (cookieOption.toLowerCase().startsWith('domain=')) {
              const domain = cookieOption.substring(7);
              try {
                const baseUrlDomain = new URL(baseUrl).hostname;
                rewrittenCookieOptions.push(`domain=${baseUrlDomain}`);
              } catch (error) {
                rewrittenCookieOptions.push(cookieOption);
              }
            } else if (cookieOption.toLowerCase().startsWith('path=')) {
              rewrittenCookieOptions.push('path=/');
            } else {
              rewrittenCookieOptions.push(cookieOption);
            }
          }

          rewrittenSetCookieValues.push(`${cookieValue}; ${rewrittenCookieOptions.join('; ')}`);
        } catch (error) {
          rewrittenSetCookieValues.push(setCookieValue);
        }
      }

      headers['set-cookie'] = rewrittenSetCookieValues;
    }

    return headers;
  }
}

module.exports = HeaderRewriterUtils;