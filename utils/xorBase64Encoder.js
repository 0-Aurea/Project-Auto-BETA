/**
 * XOR + base64 URL encoding utility class with a rotating salt.
 */
class XorBase64EncoderUtils {
  /**
   * Salt for XOR encoding.
   */
  static salt = '';

  /**
   * Generate a new random salt.
   * @returns {string} The new salt.
   */
  static generateNewSalt() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 16; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    XorBase64EncoderUtils.salt = salt;
    return salt;
  }

  /**
   * XOR encode a string with the current salt.
   * @param {string} str - The string to encode.
   * @returns {string} The XOR encoded string.
   */
  static xorEncode(str) {
    let encoded = '';
    for (let i = 0; i < str.length; i++) {
      encoded += String.fromCharCode(str.charCodeAt(i) ^ XorBase64EncoderUtils.salt.charCodeAt(i % XorBase64EncoderUtils.salt.length));
    }
    return encoded;
  }

  /**
   * Base64 URL encode a string.
   * @param {string} str - The string to encode.
   * @returns {string} The base64 URL encoded string.
   */
  static base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * XOR + base64 URL encode a string with the current salt.
   * @param {string} str - The string to encode.
   * @returns {string} The XOR + base64 URL encoded string.
   */
  static encode(str) {
    const encoded = XorBase64EncoderUtils.xorEncode(str);
    return XorBase64EncoderUtils.base64UrlEncode(encoded);
  }

  /**
   * XOR decode a string with the current salt.
   * @param {string} str - The string to decode.
   * @returns {string} The XOR decoded string.
   */
  static xorDecode(str) {
    let decoded = '';
    for (let i = 0; i < str.length; i++) {
      decoded += String.fromCharCode(str.charCodeAt(i) ^ XorBase64EncoderUtils.salt.charCodeAt(i % XorBase64EncoderUtils.salt.length));
    }
    return decoded;
  }

  /**
   * Base64 URL decode a string.
   * @param {string} str - The string to decode.
   * @returns {string} The base64 URL decoded string.
   */
  static base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4 !== 0) {
      str += '=';
    }
    return atob(str);
  }

  /**
   * XOR + base64 URL decode a string with the current salt.
   * @param {string} str - The string to decode.
   * @returns {string} The XOR + base64 URL decoded string.
   */
  static decode(str) {
    const decoded = XorBase64EncoderUtils.base64UrlDecode(str);
    return XorBase64EncoderUtils.xorDecode(decoded);
  }
}

// Generate a new salt initially
XorBase64EncoderUtils.generateNewSalt();

module.exports = XorBase64EncoderUtils;
```