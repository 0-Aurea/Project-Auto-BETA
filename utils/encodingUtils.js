'use strict';

/**
 * Encoding utility class for handling XOR + base64 encoding with rotating salt.
 */
class EncodingUtils {
  /**
   * Regular expression to match and validate base64 encoded strings.
   */
  static BASE64_REGEX = /^[A-Za-z0-9+/=]+$/;

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
    return encodedStr;
  }

  /**
   * XOR decodes a string with a given salt.
   * @param {string} str - The string to decode.
   * @param {string} salt - The salt to use for decoding.
   * @returns {string} The XOR decoded string.
   */
  static xorDecode(str, salt) {
    return EncodingUtils.xorEncode(str, salt);
  }

  /**
   * Base64 encodes a string.
   * @param {string} str - The string to encode.
   * @returns {string} The base64 encoded string.
   */
  static base64Encode(str) {
    return btoa(str);
  }

  /**
   * Base64 decodes a string.
   * @param {string} str - The string to decode.
   * @returns {string} The base64 decoded string.
   */
  static base64Decode(str) {
    return atob(str);
  }

  /**
   * URL safe base64 encodes a string.
   * @param {string} str - The string to encode.
   * @returns {string} The URL safe base64 encoded string.
   */
  static urlSafeBase64Encode(str) {
    return EncodingUtils.base64Encode(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * URL safe base64 decodes a string.
   * @param {string} str - The string to decode.
   * @returns {string} The URL safe base64 decoded string.
   */
  static urlSafeBase64Decode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4 !== 0) {
      str += '=';
    }
    return EncodingUtils.base64Decode(str);
  }

  /**
   * Encodes a URL using XOR + base64 URL encoding with a rotating salt.
   * @param {string} url - The URL to encode.
   * @param {string} salt - The rotating salt.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url, salt) {
    const encodedUrl = EncodingUtils.xorEncode(url, salt);
    return EncodingUtils.urlSafeBase64Encode(encodedUrl);
  }

  /**
   * Decodes a URL using XOR + base64 URL encoding with a rotating salt.
   * @param {string} encodedUrl - The encoded URL.
   * @param {string} salt - The rotating salt.
   * @returns {string} The decoded URL.
   */
  static decodeUrl(encodedUrl, salt) {
    const decodedUrl = EncodingUtils.urlSafeBase64Decode(encodedUrl);
    return EncodingUtils.xorDecode(decodedUrl, salt);
  }
}

module.exports = EncodingUtils;