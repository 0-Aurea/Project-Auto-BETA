const { JSDOM } = require('jsdom');
const { URL } = require('url');

/**
 * Security utility class for handling security-related tasks, such as HTML sanitization and CSP header management.
 */
class SecurityUtils {
  /**
   * Sanitizes an HTML string by removing all script and style elements, and escaping any remaining HTML special characters.
   * @param {string} html - The HTML string to sanitize.
   * @returns {string} The sanitized HTML string.
   */
  static sanitizeHtml(html) {
    const dom = new JSDOM(html);
    const { document } = dom.window;

    // Remove all script and style elements
    document.querySelectorAll('script, style').forEach((element) => element.remove());

    // Escape any remaining HTML special characters
    return dom.serialize().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Strips any unwanted headers from a response object to prevent sensitive information disclosure.
   * @param {object} response - The response object to strip headers from.
   * @returns {object} The response object with unwanted headers stripped.
   */
  static stripResponseHeaders(response) {
    const unwantedHeaders = ['Content-Security-Policy', 'Strict-Transport-Security', 'X-Frame-Options', 'X-XSS-Protection'];

    unwantedHeaders.forEach((header) => delete response.headers[header]);

    return response;
  }

  /**
   * Generates a Content Security Policy (CSP) header string to allow for a specific set of sources.
   * @param {string[]} sources - An array of sources to allow (e.g. 'self', 'https://example.com').
   * @returns {string} The CSP header string.
   */
  static generateCSPHeader(sources) {
    return `default-src 'none'; script-src ${sources.join(' ')}; object-src 'none'; frame-ancestors 'none'`;
  }

  /**
   * Checks if a URL is a potential WebRTC leak risk (i.e. it uses the 'webrtc' protocol).
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is a potential WebRTC leak risk, false otherwise.
   */
  static isWebRTCLeakRisk(url) {
    try {
      return new URL(url).protocol === 'webrtc:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Scrubs WebRTC ICE candidate information from a string to prevent IP leaks.
   * @param {string} candidate - The ICE candidate string to scrub.
   * @returns {string} The scrubbed ICE candidate string.
   */
  static scrubWebRTCICECandidate(candidate) {
    return candidate.replace(/candidate:(\w+) (\w+) (\d+\.\d+\.\d+\.\d+):(\d+)/, 'candidate:$1 $2 0.0.0.0:$4');
  }
}

module.exports = SecurityUtils;