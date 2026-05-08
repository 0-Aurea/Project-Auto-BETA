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
      // Remove any URL fragments
      if (parsedUrl.hash) {
        parsedUrl.hash = '';
      }
      // Remove any URL search parameters
      if (parsedUrl.search) {
        parsedUrl.search = '';
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
    const sanitizedHostnameRegex = /^[a-z0-9.-]+$/;
    if (!sanitizedHostnameRegex.test(sanitizedHostname)) {
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
    // Limit search query length
    if (sanitizedQuery.length > 255) {
      throw new Error('Search query too long');
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
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }
    return email.toLowerCase();
  }

  /**
   * Validates and sanitizes an IP address to prevent security vulnerabilities.
   * @param {string} ip - The IP address to validate and sanitize.
   * @returns {string} The validated and sanitized IP address.
   */
  static validateAndSanitizeIp(ip) {
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ip)) {
      throw new Error('Invalid IP address');
    }
    return ip;
  }
}

module.exports = ValidationUtils;