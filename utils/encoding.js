const crypto = require('crypto');

class EncodingUtils {
  static SALT_SIZE = 16;
  static SALT_ROTATION_INTERVAL = 60000; // 1 minute

  static salt = crypto.randomBytes(EncodingUtils.SALT_SIZE);
  static lastSaltRotation = Date.now();

  static getSalt() {
    if (Date.now() - EncodingUtils.lastSaltRotation >= EncodingUtils.SALT_ROTATION_INTERVAL) {
      EncodingUtils.salt = crypto.randomBytes(EncodingUtils.SALT_SIZE);
      EncodingUtils.lastSaltRotation = Date.now();
    }
    return EncodingUtils.salt;
  }

  static xorBuffer(buffer, salt) {
    const result = Buffer.alloc(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      result[i] = buffer[i] ^ salt[i % salt.length];
    }
    return result;
  }

  static base64UrlEncode(buffer) {
    return Buffer.from(buffer).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  static base64UrlDecode(encodedStr) {
    return Buffer.from(encodedStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  }

  static encodeUrl(url) {
    const salt = EncodingUtils.getSalt();
    const buffer = Buffer.from(url, 'utf8');
    const xored = EncodingUtils.xorBuffer(buffer, salt);
    const encoded = EncodingUtils.base64UrlEncode(xored);
    return encoded.toString('utf8');
  }

  static decodeUrl(encodedStr) {
    try {
      const encodedBuffer = Buffer.from(encodedStr, 'utf8');
      const decodedBuffer = EncodingUtils.base64UrlDecode(encodedBuffer);
      const salt = EncodingUtils.getSalt();
      const xoredBack = EncodingUtils.xorBuffer(decodedBuffer, salt);
      return xoredBack.toString('utf8');
    } catch (error) {
      throw new Error('Invalid encoded URL');
    }
  }
}

module.exports = EncodingUtils;