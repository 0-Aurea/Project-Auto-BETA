const { URL } = require('url');

/**
 * WebRTC ICE candidate scrubber utility class for handling WebRTC IP leaks.
 */
class WebRTCIceCandidateScrubber {
  /**
   * Regular expression to match WebRTC ICE candidate messages.
   */
  static ICE_CANDIDATE_REGEX = /^candidate:.*$/;

  /**
   * Scrub WebRTC ICE candidate messages to prevent IP leaks.
   * @param {string} candidate - The WebRTC ICE candidate message.
   * @returns {string} The scrubbed WebRTC ICE candidate message.
   */
  static scrubIceCandidate(candidate) {
    if (WebRTCIceCandidateScrubber.ICE_CANDIDATE_REGEX.test(candidate)) {
      return 'candidate:fake';
    }
    return candidate;
  }
}

/**
 * Cookie scoping utility class for handling cookie isolation.
 */
class CookieScopingUtils {
  /**
   * Regular expression to match cookie headers.
   */
  static COOKIE_HEADER_REGEX = /^Cookie:.*$/i;

  /**
   * Regular expression to match set-cookie headers.
   */
  static SET_COOKIE_HEADER_REGEX = /^Set-Cookie:.*$/i;

  /**
   * Isolate cookies per proxied origin to prevent cookie leakage.
   * @param {object} request - The request object.
   * @param {object} response - The response object.
   * @param {string} origin - The proxied origin.
   */
  static isolateCookies(request, response, origin) {
    const cookieHeader = request.headers['cookie'];
    if (cookieHeader) {
      const isolatedCookieHeader = CookieScopingUtils.isolateCookieHeader(cookieHeader, origin);
      request.headers['cookie'] = isolatedCookieHeader;
    }

    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const isolatedSetCookieHeader = CookieScopingUtils.isolateSetCookieHeader(setCookieHeader, origin);
      response.headers['set-cookie'] = isolatedSetCookieHeader;
    }
  }

  /**
   * Isolate a cookie header for a specific origin.
   * @param {string} cookieHeader - The cookie header.
   * @param {string} origin - The origin.
   * @returns {string} The isolated cookie header.
   */
  static isolateCookieHeader(cookieHeader, origin) {
    const cookies = cookieHeader.split(';');
    const isolatedCookies = cookies.filter((cookie) => {
      const [name, value] = cookie.trim().split('=');
      return CookieScopingUtils.isCookieForOrigin(name, origin);
    });
    return isolatedCookies.join(';');
  }

  /**
   * Isolate a set-cookie header for a specific origin.
   * @param {string} setCookieHeader - The set-cookie header.
   * @param {string} origin - The origin.
   * @returns {string} The isolated set-cookie header.
   */
  static isolateSetCookieHeader(setCookieHeader, origin) {
    const isolatedSetCookieHeader = setCookieHeader.replace(/Domain=[^;]*/g, `Domain=${new URL(origin).hostname}`);
    return isolatedSetCookieHeader;
  }

  /**
   * Check if a cookie is for a specific origin.
   * @param {string} cookieName - The cookie name.
   * @param {string} origin - The origin.
   * @returns {boolean} True if the cookie is for the origin, false otherwise.
   */
  static isCookieForOrigin(cookieName, origin) {
    const cookieDomain = new URL(origin).hostname;
    return cookieName.includes(cookieDomain);
  }
}

/**
 * Security utility class for handling various security-related tasks.
 */
class SecurityUtils {
  /**
   * Scrub WebRTC ICE candidate messages to prevent IP leaks.
   * @param {string} candidate - The WebRTC ICE candidate message.
   * @returns {string} The scrubbed WebRTC ICE candidate message.
   */
  static scrubWebRTCIceCandidate(candidate) {
    return WebRTCIceCandidateScrubber.scrubIceCandidate(candidate);
  }

  /**
   * Isolate cookies per proxied origin to prevent cookie leakage.
   * @param {object} request - The request object.
   * @param {object} response - The response object.
   * @param {string} origin - The proxied origin.
   */
  static isolateCookies(request, response, origin) {
    return CookieScopingUtils.isolateCookies(request, response, origin);
  }
}

module.exports = SecurityUtils;