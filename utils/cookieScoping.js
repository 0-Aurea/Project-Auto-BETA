const { URL } = require('url');

/**
 * Cookie scoping utility class for isolating cookies per proxied origin.
 */
class CookieScopingUtils {
  /**
   * Regular expression to match cookie headers.
   */
  static COOKIE_HEADER_REGEX = /Set-Cookie: (.*)/gi;

  /**
   * Regular expression to match cookie attributes.
   */
  static COOKIE_ATTRIBUTE_REGEX = /(?:; )?(?:Secure|HttpOnly|SameSite=|Max-Age|Expires)=/gi;

  /**
   * Regular expression to match domain attributes.
   */
  static DOMAIN_ATTRIBUTE_REGEX = /(?:; )?(?:Domain)=/gi;

  /**
   * Isolate cookies per proxied origin and rewrite cookie headers.
   * @param {string} requestUrl - The URL of the proxied request.
   * @param {string} responseHeaders - The response headers from the proxied origin.
   * @returns {string} The rewritten response headers with isolated cookies.
   */
  static isolateCookies(requestUrl, responseHeaders) {
    const requestOrigin = new URL(requestUrl).origin;
    const rewrittenHeaders = responseHeaders.replace(CookieScopingUtils.COOKIE_HEADER_REGEX, (match, cookie) => {
      const isolatedCookie = CookieScopingUtils.isolateCookie(requestOrigin, cookie);
      return `Set-Cookie: ${isolatedCookie}`;
    });

    return rewrittenHeaders;
  }

  /**
   * Isolate a single cookie by rewriting its domain and path attributes.
   * @param {string} requestOrigin - The origin of the proxied request.
   * @param {string} cookie - The cookie to isolate.
   * @returns {string} The isolated cookie.
   */
  static isolateCookie(requestOrigin, cookie) {
    const domainMatch = cookie.match(CookieScopingUtils.DOMAIN_ATTRIBUTE_REGEX);
    let isolatedCookie = cookie;

    if (domainMatch) {
      const domainAttribute = domainMatch[0];
      isolatedCookie = isolatedCookie.replace(domainAttribute, `; Domain=${new URL(requestOrigin).hostname}`);
    }

    isolatedCookie = isolatedCookie.replace(CookieScopingUtils.COOKIE_ATTRIBUTE_REGEX, '');
    isolatedCookie += '; Secure; HttpOnly';

    return isolatedCookie;
  }

  /**
   * Clear cookies for a given origin.
   * @param {string} origin - The origin for which to clear cookies.
   */
  static clearCookies(origin) {
    // Implementation of clearing cookies (e.g., using the Cache API or IndexedDB)
  }
}

module.exports = CookieScopingUtils;