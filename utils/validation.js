'use strict';

/**
 * Validation and sanitization utility class for user input to prevent security vulnerabilities.
 */
class ValidationUtils {
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
      return url;
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
    if (!sanitizedQuery) {
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
      return referer;
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
}

module.exports = ValidationUtils;