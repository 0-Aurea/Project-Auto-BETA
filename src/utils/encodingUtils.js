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
   * XORs a buffer with a salt and returns the result.
   * @param {Buffer} buffer - The buffer to XOR.
   * @param {Buffer} salt - The salt to use.
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
   * Encodes a URL using XOR + base64 encoding with a rotating salt.
   * @param {string} url - The URL to encode.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url) {
    const salt = EncodingUtils.getSalt();
    const buffer = Buffer.from(url, 'utf8');
    const xorBuffer = EncodingUtils.xorBuffer(buffer, salt);
    return xorBuffer.toString('base64');
  }

  /**
   * Decodes a URL using XOR + base64 decoding with a rotating salt.
   * @param {string} encodedUrl - The URL to decode.
   * @returns {string} The decoded URL.
   */
  static decodeUrl(encodedUrl) {
    const buffer = Buffer.from(encodedUrl, 'base64');
    const salt = EncodingUtils.getSalt();
    const xorBuffer = EncodingUtils.xorBuffer(buffer, salt);
    return xorBuffer.toString('utf8');
  }
}

module.exports = EncodingUtils;