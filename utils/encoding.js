const crypto = require('crypto');
const SecurityUtils = require('./securityUtils');

/**
 * Encoding utility functions.
 */
class Encoding {
  /**
   * Salt for encoding and decoding.
   */
  static salt = SecurityUtils.generateSalt();

  /**
   * Encodes a URL using the current salt.
   * @param {string} url The URL to encode.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url) {
    const buffer = Buffer.from(url, 'utf-8');
    const saltBuffer = Buffer.from(Encoding.salt, 'utf-8');
    const encodedBuffer = Buffer.alloc(buffer.length);

    for (let i = 0; i < buffer.length; i++) {
      encodedBuffer[i] = buffer[i] ^ saltBuffer[i % saltBuffer.length];
    }

    return encodedBuffer.toString('base64');
  }

  /**
   * Decodes an encoded URL using the current salt.
   * @param {string} encodedStr The encoded URL to decode.
   * @returns {string} The decoded URL.
   * @throws {Error} If the encoded URL is invalid.
   */
  static decodeUrl(encodedStr) {
    if (typeof encodedStr !== 'string') {
      throw new Error('Encoded string must be a string');
    }

    try {
      const encodedBuffer = Buffer.from(encodedStr, 'base64');
      const saltBuffer = Buffer.from(Encoding.salt, 'utf-8');
      const decodedBuffer = Buffer.alloc(encodedBuffer.length);

      for (let i = 0; i < encodedBuffer.length; i++) {
        decodedBuffer[i] = encodedBuffer[i] ^ saltBuffer[i % saltBuffer.length];
      }

      return decodedBuffer.toString('utf-8');
    } catch (error) {
      throw new Error('Invalid encoded URL');
    }
  }
}

module.exports = Encoding;