const crypto = require('crypto');

/**
 * Encoding utility class for managing rotating salts and XOR + base64 encoding/decoding of URLs.
 */
class EncodingUtils {
  /**
   * Size of the salt in bytes.
   */
  static SALT_SIZE = 16;

  /**
   * Interval in milliseconds to rotate the salt.
   */
  static SALT_ROTATION_INTERVAL = 60000; // 1 minute

  /**
   * Current salt.
   */
  static salt = crypto.randomBytes(EncodingUtils.SALT_SIZE);

  /**
   * Timestamp of the last salt rotation.
   */
  static lastSaltRotation = Date.now();

  /**
   * Returns the current salt, rotating it if necessary.
   * @returns {Buffer} The current salt.
   */
  static getSalt() {
    if (Date.now() - EncodingUtils.lastSaltRotation >= EncodingUtils.SALT_ROTATION_INTERVAL) {
      EncodingUtils.salt = crypto.randomBytes(EncodingUtils.SALT_SIZE);
      EncodingUtils.lastSaltRotation = Date.now();
    }
    return EncodingUtils.salt;
  }

  /**
   * XORs a buffer with a salt.
   * @param {Buffer} buffer The buffer to XOR.
   * @param {Buffer} salt The salt to use.
   * @returns {Buffer} The XORed buffer.
   */
  static xorBuffer(buffer, salt) {
    const result = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      result[i] = buffer[i] ^ salt[i % salt.length];
    }
    return result;
  }

  /**
   * Encodes a buffer to a base64 URL string.
   * @param {Buffer} buffer The buffer to encode.
   * @returns {string} The base64 URL string.
   */
  static base64UrlEncode(buffer) {
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Decodes a base64 URL string to a buffer.
   * @param {string} encodedStr The base64 URL string to decode.
   * @returns {Buffer} The decoded buffer.
   */
  static base64UrlDecode(encodedStr) {
    return Buffer.from(encodedStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  }

  /**
   * Encodes a URL using the current salt.
   * @param {string} url The URL to encode.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url) {
    const salt = EncodingUtils.getSalt();
    const buffer = Buffer.from(url, 'utf8');
    const xored = EncodingUtils.xorBuffer(buffer, salt);
    return EncodingUtils.base64UrlEncode(xored);
  }

  /**
   * Decodes an encoded URL using the current salt.
   * @param {string} encodedStr The encoded URL to decode.
   * @returns {string} The decoded URL.
   * @throws {Error} If the encoded URL is invalid.
   */
  static decodeUrl(encodedStr) {
    try {
      const encodedBuffer = EncodingUtils.base64UrlDecode(encodedStr);
      const salt = EncodingUtils.getSalt();
      const xoredBack = EncodingUtils.xorBuffer(encodedBuffer, salt);
      return xoredBack.toString('utf8');
    } catch (error) {
      throw new Error('Invalid encoded URL');
    }
  }
}

module.exports = EncodingUtils;