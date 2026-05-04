const crypto = require('crypto');
const { Buffer } = require('buffer');

/**
 * DTLS utilities for handling DTLS connections and enhancing WebRTC security.
 */
class DTLSUtils {
  /**
   * Generate a DTLS fingerprint.
   * @param {string} certificate - The certificate to generate the fingerprint from.
   * @returns {string} The DTLS fingerprint.
   */
  static generateFingerprint(certificate) {
    const hash = crypto.createHash('sha1');
    hash.update(certificate);
    return hash.digest('hex');
  }

  /**
   * Create a DTLS context.
   * @param {object} options - The DTLS context options.
   * @returns {object} The DTLS context.
   */
  static createContext(options) {
    return crypto.createDtlsContext(options);
  }

  /**
   * Handle a DTLS handshake.
   * @param {object} context - The DTLS context.
   * @param {Buffer} data - The handshake data.
   * @returns {Buffer} The handshake response.
   */
  static handleHandshake(context, data) {
    return context.handleHandshake(data);
  }

  /**
   * Verify a DTLS certificate.
   * @param {object} context - The DTLS context.
   * @param {string} certificate - The certificate to verify.
   * @returns {boolean} True if the certificate is valid, false otherwise.
   */
  static verifyCertificate(context, certificate) {
    return context.verifyCertificate(certificate);
  }

  /**
   * Generate a DTLS key pair.
   * @returns {object} The DTLS key pair.
   */
  static generateKeyPair() {
    return crypto.generateKeyPairSync('ec', {
      namedCurve: 'sect571r1',
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
  }

  /**
   * Encrypt a DTLS message.
   * @param {object} context - The DTLS context.
   * @param {Buffer} data - The message to encrypt.
   * @returns {Buffer} The encrypted message.
   */
  static encrypt(context, data) {
    return context.encrypt(data);
  }

  /**
   * Decrypt a DTLS message.
   * @param {object} context - The DTLS context.
   * @param {Buffer} data - The message to decrypt.
   * @returns {Buffer} The decrypted message.
   */
  static decrypt(context, data) {
    return context.decrypt(data);
  }
}

module.exports = DTLSUtils;