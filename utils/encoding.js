const { EncodingUtils } = require('./encodingUtils');

/**
 * Encoding utility functions.
 */
class Encoding {
  /**
   * Encodes a URL using the current salt.
   * @param {string} url The URL to encode.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url) {
    return EncodingUtils.encodeUrl(url);
  }

  /**
   * Decodes an encoded URL using the current salt.
   * @param {string} encodedStr The encoded URL to decode.
   * @returns {string} The decoded URL.
   * @throws {Error} If the encoded URL is invalid.
   */
  static decodeUrl(encodedStr) {
    return EncodingUtils.decodeUrl(encodedStr);
  }
}

module.exports = Encoding;