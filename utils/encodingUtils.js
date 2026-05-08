const crypto = require('crypto');

/**
 * Encoding utility class for managing URL-safe base64 encoding and decoding.
 */
class EncodingUtils {
  /**
   * Encode a URL using URL-safe base64 encoding.
   * @param {string} url - The URL to encode.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url) {
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(url);
    const encodedBytes = Buffer.from(urlBytes).toString('base64');
    return encodedBytes.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Decode a URL using URL-safe base64 decoding.
   * @param {string} encodedUrl - The URL to decode.
   * @returns {string} The decoded URL.
   */
  static decodeUrl(encodedUrl) {
    const paddedEncodedUrl = encodedUrl + '='.repeat((4 - (encodedUrl.length % 4)) % 4);
    const decoder = new TextDecoder();
    const encodedBytes = paddedEncodedUrl.replace(/-/g, '+').replace(/_/g, '/');
    const urlBytes = Buffer.from(encodedBytes, 'base64');
    return decoder.decode(urlBytes);
  }
}

module.exports = EncodingUtils;