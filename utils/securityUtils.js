'use strict';

/**
 * Security utility class for handling various security-related tasks.
 */
class SecurityUtils {
  /**
   * Regular expression to match and validate base64 encoded strings.
   */
  static BASE64_REGEX = /^[A-Za-z0-9+/=]+$/;

  /**
   * Generates a random salt for XOR encoding.
   * @returns {string} A random salt.
   */
  static generateSalt() {
    return Math.random().toString(36).slice(2);
  }

  /**
   * XOR encodes a string with a given salt.
   * @param {string} str - The string to encode.
   * @param {string} salt - The salt to use for encoding.
   * @returns {string} The XOR encoded string.
   */
  static xorEncode(str, salt) {
    let encodedStr = '';
    for (let i = 0; i < str.length; i++) {
      encodedStr += String.fromCharCode(str.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return btoa(encodedStr);
  }

  /**
   * XOR decodes a string with a given salt.
   * @param {string} encodedStr - The string to decode.
   * @param {string} salt - The salt to use for decoding.
   * @returns {string} The XOR decoded string.
   */
  static xorDecode(encodedStr, salt) {
    const decodedStr = atob(encodedStr);
    let result = '';
    for (let i = 0; i < decodedStr.length; i++) {
      result += String.fromCharCode(decodedStr.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return result;
  }

  /**
   * Validates a base64 encoded string.
   * @param {string} encodedStr - The string to validate.
   * @returns {boolean} True if the string is a valid base64 encoded string, false otherwise.
   */
  static isValidBase64(encodedStr) {
    return SecurityUtils.BASE64_REGEX.test(encodedStr);
  }

  /**
   * Escapes a string to prevent XSS attacks.
   * @param {string} str - The string to escape.
   * @returns {string} The escaped string.
   */
  static escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Scrubs WebRTC ICE candidate to prevent IP leaks.
   * @param {object} candidate - The WebRTC ICE candidate to scrub.
   * @returns {object} The scrubbed WebRTC ICE candidate.
   */
  static scrubWebrtcIceCandidate(candidate) {
    if (candidate && candidate.candidate) {
      const candidateStr = candidate.candidate;
      const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
      const ipMatches = candidateStr.match(ipRegex);
      if (ipMatches) {
        ipMatches.forEach(ip => {
          candidate.candidate = candidate.candidate.replace(ip, '0.0.0.0');
        });
      }
    }
    return candidate;
  }
}

module.exports = SecurityUtils;