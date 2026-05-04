'use strict';

/**
 * Validation and sanitization utility class for user input.
 */
class ValidationUtils {
  /**
   * Regular expression to match and validate URL schemes.
   */
  static URL_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

  /**
   * Regular expression to match and validate URL origins.
   */
  static URL_ORIGIN_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:[0-9]{1,5})?/;

  /**
   * Validate a URL and ensure it has a valid scheme and origin.
   * @param {string} url - The URL to validate.
   * @returns {boolean} True if the URL is valid, false otherwise.
   */
  static isValidUrl(url) {
    try {
      const { protocol, hostname } = new URL(url);
      return ValidationUtils.URL_SCHEME_REGEX.test(protocol) && ValidationUtils.URL_ORIGIN_REGEX.test(hostname);
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitize a URL by removing any unnecessary or malicious parts.
   * @param {string} url - The URL to sanitize.
   * @returns {string} The sanitized URL.
   */
  static sanitizeUrl(url) {
    try {
      const { protocol, hostname, pathname, search, hash } = new URL(url);
      return `${protocol}//${hostname}${pathname}${search}${hash}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Validate and sanitize a URL-encoded string.
   * @param {string} encodedStr - The URL-encoded string to validate and sanitize.
   * @returns {string} The validated and sanitized URL-encoded string.
   */
  static validateAndSanitizeEncodedStr(encodedStr) {
    try {
      const decodedStr = decodeURIComponent(encodedStr);
      return ValidationUtils.sanitizeUrl(decodedStr);
    } catch (error) {
      return '';
    }
  }

  /**
   * Validate a hostname and ensure it does not contain any invalid characters.
   * @param {string} hostname - The hostname to validate.
   * @returns {boolean} True if the hostname is valid, false otherwise.
   */
  static isValidHostname(hostname) {
    const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
    return hostnameRegex.test(hostname);
  }

  /**
   * Validate an IP address and ensure it is in a valid format.
   * @param {string} ipAddress - The IP address to validate.
   * @returns {boolean} True if the IP address is valid, false otherwise.
   */
  static isValidIpAddress(ipAddress) {
    const ipAddressRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipAddressRegex.test(ipAddress);
  }
}

module.exports = ValidationUtils;