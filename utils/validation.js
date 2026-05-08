'use strict';

/**
 * Validation and sanitization utility class for user input to prevent security vulnerabilities.
 */
class ValidationUtils {
  /**
   * Regular expression to validate URLs.
   */
  static URL_REGEX = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/;

  /**
   * Regular expression to validate hostnames.
   */
  static HOSTNAME_REGEX = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /**
   * Regular expression to validate search queries.
   */
  static SEARCH_QUERY_REGEX = /^[a-zA-Z0-9\s]{1,255}$/;

  /**
   * Regular expression to validate email addresses.
   */
  static EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /**
   * Validates and sanitizes a URL to prevent security vulnerabilities.
   * @param {string} url - The URL to validate and sanitize.
   * @returns {string} The validated and sanitized URL.
   */
  static validateAndSanitizeUrl(url) {
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol || !parsedUrl.host) {
        throw new Error('Invalid URL');
      }
      // Check for SSRF and other security vulnerabilities
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
        throw new Error('SSRF vulnerability detected');
      }
      if (parsedUrl.protocol === 'file:') {
        throw new Error('File protocol not allowed');
      }
      // Remove any URL fragments
      if (parsedUrl.hash) {
        parsedUrl.hash = '';
      }
      // Remove any URL search parameters
      if (parsedUrl.search) {
        parsedUrl.search = '';
      }
      // Validate URL against regex
      if (!ValidationUtils.URL_REGEX.test(parsedUrl.href)) {
        throw new Error('Invalid URL');
      }
      return parsedUrl.href;
    } catch (error) {
      throw new Error(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Validates and sanitizes a hostname to prevent security vulnerabilities.
   * @param {string} hostname - The hostname to validate and sanitize.
   * @returns {string} The validated and sanitized hostname.
   */
  static validateAndSanitizeHostname(hostname) {
    const sanitizedHostname = hostname.trim().toLowerCase();
    if (!sanitizedHostname || sanitizedHostname.length > 255) {
      throw new Error('Invalid hostname');
    }
    // Remove any invalid characters
    if (!ValidationUtils.HOSTNAME_REGEX.test(sanitizedHostname)) {
      throw new Error('Invalid hostname');
    }
    // Check for SSRF and other security vulnerabilities
    if (sanitizedHostname === 'localhost' || sanitizedHostname === '127.0.0.1') {
      throw new Error('SSRF vulnerability detected');
    }
    return sanitizedHostname;
  }

  /**
   * Validates and sanitizes a path to prevent security vulnerabilities.
   * @param {string} path - The path to validate and sanitize.
   * @returns {string} The validated and sanitized path.
   */
  static validateAndSanitizePath(path) {
    const sanitizedPath = path.trim().replace(/\/+/g, '/');
    if (sanitizedPath.startsWith('/')) {
      return sanitizedPath;
    }
    return '/' + sanitizedPath;
  }

  /**
   * Validates a search query to prevent security vulnerabilities.
   * @param {string} query - The search query to validate.
   * @returns {string} The validated search query.
   */
  static validateSearchQuery(query) {
    const sanitizedQuery = query.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    if (!ValidationUtils.SEARCH_QUERY_REGEX.test(sanitizedQuery)) {
      throw new Error('Invalid search query');
    }
    return sanitizedQuery;
  }

  /**
   * Validates and sanitizes a referer URL to prevent security vulnerabilities.
   * @param {string} referer - The referer URL to validate and sanitize.
   * @returns {string} The validated and sanitized referer URL.
   */
  static validateAndSanitizeReferer(referer) {
    try {
      const parsedUrl = new URL(referer);
      if (!parsedUrl.protocol || !parsedUrl.host) {
        throw new Error('Invalid referer URL');
      }
      // Remove any URL fragments
      if (parsedUrl.hash) {
        parsedUrl.hash = '';
      }
      // Remove any URL search parameters
      if (parsedUrl.search) {
        parsedUrl.search = '';
      }
      // Validate URL against regex
      if (!ValidationUtils.URL_REGEX.test(parsedUrl.href)) {
        throw new Error('Invalid referer URL');
      }
      return parsedUrl.href;
    } catch (error) {
      throw new Error(`Invalid referer URL: ${error.message}`);
    }
  }

  /**
   * Checks if a string contains any malicious characters.
   * @param {string} input - The string to check.
   * @returns {boolean} True if the string contains malicious characters, false otherwise.
   */
  static containsMaliciousChars(input) {
    const maliciousChars = /[<>\"'`{};]/.test(input);
    return maliciousChars;
  }

  /**
   * Validates and sanitizes an email address to prevent security vulnerabilities.
   * @param {string} email - The email address to validate and sanitize.
   * @returns {string} The validated and sanitized email address.
   */
  static validateAndSanitizeEmail(email) {
    if (!ValidationUtils.EMAIL_REGEX.test(email)) {
      throw new Error('Invalid email address');
    }
    return email.trim().toLowerCase();
  }
}

module.exports = ValidationUtils;