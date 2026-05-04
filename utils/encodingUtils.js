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
   * Encode a URL using XOR + base64 URL encoding with a rotating salt.
   * @param {string} url - The URL to encode.
   * @returns {string} The encoded URL.
   */
  static encodeUrl(url) {
    const salt = EncodingUtils.getSalt();
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(url);
    const xorBytes = Buffer.alloc(urlBytes.length);
    for (let i = 0; i < urlBytes.length; i++) {
      xorBytes[i] = urlBytes[i] ^ salt[i % salt.length];
    }
    return Buffer.from(xorBytes).toString('base64url');
  }

  /**
   * Decode a URL using XOR + base64 URL decoding with a rotating salt.
   * @param {string} encodedUrl - The URL to decode.
   * @returns {string} The decoded URL.
   */
  static decodeUrl(encodedUrl) {
    const salt = EncodingUtils.getSalt();
    const decoder = new TextDecoder();
    const xorBytes = Buffer.from(encodedUrl, 'base64url');
    const urlBytes = Buffer.alloc(xorBytes.length);
    for (let i = 0; i < xorBytes.length; i++) {
      urlBytes[i] = xorBytes[i] ^ salt[i % salt.length];
    }
    return decoder.decode(urlBytes);
  }
}

module.exports = EncodingUtils;