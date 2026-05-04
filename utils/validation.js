/**
 * Validation utility class for checking URL validity, request formatting, and other essential checks.
 */
class ValidationUtils {
  /**
   * Regular expression to match valid URLs.
   */
  static URL_REGEX = /^https?:\/\/(?:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(?::[0-9]{1,5})?(?:[\/?#][^\s]*)?$/;

  /**
   * Regular expression to match valid URL origins.
   */
  static ORIGIN_REGEX = /^https?:\/\/(?:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})(?::[0-9]{1,5})?$/;

  /**
   * Checks if a URL is valid.
   * @param {string} url - The URL to validate.
   * @returns {boolean} True if the URL is valid, false otherwise.
   */
  static isValidUrl(url) {
    try {
      return ValidationUtils.URL_REGEX.test(url);
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a URL origin is valid.
   * @param {string} origin - The URL origin to validate.
   * @returns {boolean} True if the URL origin is valid, false otherwise.
   */
  static isValidOrigin(origin) {
    try {
      return ValidationUtils.ORIGIN_REGEX.test(origin);
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a request object is properly formatted.
   * @param {object} request - The request object to validate.
   * @returns {boolean} True if the request object is valid, false otherwise.
   */
  static isValidRequest(request) {
    return (
      request &&
      request.method &&
      request.url &&
      request.headers &&
      request.headers['content-type']
    );
  }

  /**
   * Checks if a URL is a valid WebSocket URL.
   * @param {string} url - The URL to validate.
   * @returns {boolean} True if the URL is a valid WebSocket URL, false otherwise.
   */
  static isValidWebSocketUrl(url) {
    try {
      const { protocol } = new URL(url);
      return protocol === 'ws:' || protocol === 'wss:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Validates a proxied page's HTML content.
   * @param {string} html - The HTML content to validate.
   * @returns {boolean} True if the HTML content is valid, false otherwise.
   */
  static isValidHtml(html) {
    try {
      const { JSDOM } = require('jsdom');
      const dom = new JSDOM(html);
      return dom.window.document.documentElement.tagName === 'HTML';
    } catch (error) {
      return false;
    }
  }
}

module.exports = ValidationUtils;