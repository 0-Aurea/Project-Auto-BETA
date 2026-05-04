const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { generateKeyPair, createSelfSignedCertificate } = require('crypto');

/**
 * TLS Certificate Manager utility class for handling TLS certificates and certificate rotation.
 */
class TLSCertificateManager {
  /**
   * Certificate storage directory.
   */
  static CERTIFICATE_DIR = 'tls-certificates';

  /**
   * Certificate file name.
   */
  static CERTIFICATE_FILE = 'certificate.crt';

  /**
   * Private key file name.
   */
  static PRIVATE_KEY_FILE = 'private.key';

  /**
   * Certificate rotation interval in milliseconds.
   */
  static CERTIFICATE_ROTATION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Generate a new self-signed certificate and private key.
   * @returns {Promise<{ certificate: string, privateKey: string }>} The generated certificate and private key.
   */
  static async generateCertificate() {
    const keyPair = await promisify(generateKeyPair)('rsa', {
      modulusLength: 2048,
      publicExponent: 65537,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    const certificate = await promisify(createSelfSignedCertificate)(keyPair.privateKey, {
      days: 30,
      serial: 1,
      subject: {
        C: 'US',
        ST: 'State',
        L: 'Locality',
        O: 'Organization',
        OU: 'Organizational Unit',
        CN: 'localhost',
      },
    });

    return {
      certificate: certificate.export({
        type: 'spki',
        format: 'pem',
      }),
      privateKey: keyPair.privateKey,
    };
  }

  /**
   * Load the existing certificate and private key from disk.
   * @returns {Promise<{ certificate: string, privateKey: string }>} The loaded certificate and private key.
   */
  static async loadCertificate() {
    try {
      const certificatePath = path.join(TLSCertificateManager.CERTIFICATE_DIR, TLSCertificateManager.CERTIFICATE_FILE);
      const privateKeyPath = path.join(TLSCertificateManager.CERTIFICATE_DIR, TLSCertificateManager.PRIVATE_KEY_FILE);

      const certificate = await promisify(fs.readFile)(certificatePath, 'utf8');
      const privateKey = await promisify(fs.readFile)(privateKeyPath, 'utf8');

      return { certificate, privateKey };
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Certificate files do not exist, generate new ones.
        return TLSCertificateManager.generateCertificate();
      }
      throw error;
    }
  }

  /**
   * Save the certificate and private key to disk.
   * @param {string} certificate - The certificate to save.
   * @param {string} privateKey - The private key to save.
   * @returns {Promise<void>}
   */
  static async saveCertificate(certificate, privateKey) {
    const certificatePath = path.join(TLSCertificateManager.CERTIFICATE_DIR, TLSCertificateManager.CERTIFICATE_FILE);
    const privateKeyPath = path.join(TLSCertificateManager.CERTIFICATE_DIR, TLSCertificateManager.PRIVATE_KEY_FILE);

    await promisify(fs.mkdir)(TLSCertificateManager.CERTIFICATE_DIR, { recursive: true });
    await promisify(fs.writeFile)(certificatePath, certificate);
    await promisify(fs.writeFile)(privateKeyPath, privateKey);
  }

  /**
   * Rotate the certificate and private key.
   * @returns {Promise<void>}
   */
  static async rotateCertificate() {
    const { certificate, privateKey } = await TLSCertificateManager.generateCertificate();
    await TLSCertificateManager.saveCertificate(certificate, privateKey);
  }

  /**
   * Initialize the certificate manager and rotate the certificate if necessary.
   * @returns {Promise<void>}
   */
  static async init() {
    try {
      const { certificate } = await TLSCertificateManager.loadCertificate();
      const certNotBefore = new Date(certificate.notBefore);
      const certNotAfter = new Date(certificate.notAfter);

      const timeUntilRotation = certNotAfter.getTime() - Date.now();
      if (timeUntilRotation < TLSCertificateManager.CERTIFICATE_ROTATION_INTERVAL) {
        await TLSCertificateManager.rotateCertificate();
      }
    } catch (error) {
      await TLSCertificateManager.rotateCertificate();
    }
  }
}

module.exports = TLSCertificateManager;