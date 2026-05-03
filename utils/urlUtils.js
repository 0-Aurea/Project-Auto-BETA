const { URL } = require('url');

/**
 * URL utility class for handling URL parsing and rewriting.
 */
class UrlUtils {
  /**
   * Regular expression to match URL protocols.
   */
  static PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

  /**
   * Regular expression to match URL origins.
   */
  static ORIGIN_REGEX = /^([a-zA-Z][a-zA-Z0-9+.-]*:)?(\/\/[^\s]*)?/;

  /**
   * Encode a URL using XOR + base64 URL encoding with a rotating salt.
   * @param {string} url - The URL to encode.
   * @param {string} salt - The rotating salt.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url, salt) {
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(url);
    const saltBytes = encoder.encode(salt);
    const encodedBytes = new Uint8Array(urlBytes.length);

    for (let i = 0; i < urlBytes.length; i++) {
      encodedBytes[i] = urlBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    return btoa(String.fromCharCode(...encodedBytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  /**
   * Decode a URL using XOR + base64 URL decoding with a rotating salt.
   * @param {string} encodedUrl - The encoded URL.
   * @param {string} salt - The rotating salt.
   * @returns {string} The decoded URL.
   */
  static decodeUrl(encodedUrl, salt) {
    const decoder = new TextDecoder();
    const encodedBytes = new Uint8Array(atob(encodedUrl.replace('-', '+').replace('_', '/').padEnd(Math.ceil(encodedUrl.length / 4) * 4, '=')).length);
    for (let i = 0; i < encodedBytes.length; i++) {
      encodedBytes[i] = encodedUrl.charCodeAt(i);
    }

    const saltBytes = new TextEncoder().encode(salt);
    const decodedBytes = new Uint8Array(encodedBytes.length);

    for (let i = 0; i < encodedBytes.length; i++) {
      decodedBytes[i] = encodedBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    return decoder.decode(decodedBytes);
  }

  /**
   * Rewrite a URL to use the proxy's origin.
   * @param {string} url - The URL to rewrite.
   * @param {string} proxyOrigin - The proxy's origin.
   * @returns {string} The rewritten URL.
   */
  static rewriteUrl(url, proxyOrigin) {
    const { origin, pathname, search, hash } = new URL(url);
    return `${proxyOrigin}${pathname}${search}${hash}`;
  }

  /**
   * Check if a URL is a valid proxied URL.
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is a valid proxied URL, false otherwise.
   */
  static isValidProxiedUrl(url) {
    return UrlUtils.PROTOCOL_REGEX.test(url) && UrlUtils.ORIGIN_REGEX.test(url);
  }
}

module.exports = { UrlUtils };