const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { createCertificate, createPrivateKey, createCertificateSigningRequest } = require('crypto');

/**
 * TLS Certificate Manager utility class for handling TLS certificates.
 */
class TLSCertificateManager {
  /**
   * Directory to store TLS certificates.
   */
  static CERT_DIR = 'tls/certs';

  /**
   * Directory to store private keys.
   */
  static KEY_DIR = 'tls/keys';

  /**
   * Create directories for certificates and keys if they don't exist.
   */
  static async init() {
    try {
      await promisify(fs.mkdir)(TLSCertificateManager.CERT_DIR, { recursive: true });
      await promisify(fs.mkdir)(TLSCertificateManager.KEY_DIR, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }

  /**
   * Generate a new self-signed TLS certificate.
   * @param {string} domain - The domain for the certificate.
   * @param {number} days - The number of days the certificate is valid.
   * @returns {Promise<{ cert: string, key: string }>} A promise resolving to the certificate and private key.
   */
  static async generateSelfSignedCertificate(domain, days = 365) {
    const key = await promisify(createPrivateKey)({
      type: 'spki',
      format: 'pem',
      privateKey: {
        type: 'pkcs8',
        format: 'pem',
        privateKey: createPrivateKey({
          type: 'pkcs1',
          format: 'pem',
          modulusLength: 2048,
          publicExponent: 65537,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
        }).export({
          type: 'pkcs8',
          format: 'pem',
        }),
      },
    });

    const csr = await promisify(createCertificateSigningRequest)({
      subject: {
        CN: domain,
      },
      publicKey: key,
    });

    const cert = await promisify(createCertificate)({
      subject: {
        CN: domain,
      },
      issuer: {
        CN: domain,
      },
      serialNumber: '01',
      validity: {
        notBefore: new Date(),
        notAfter: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
      publicKey: csr.publicKey,
      signingKey: key,
      extensions: [
        {
          name: 'basicConstraints',
          cA: true,
        },
        {
          name: 'subjectAlternativeName',
          altNames: [
            {
              type: 2,
              value: domain,
            },
          ],
        },
      ],
    });

    const certPath = path.join(TLSCertificateManager.CERT_DIR, `${domain}.crt`);
    const keyPath = path.join(TLSCertificateManager.KEY_DIR, `${domain}.key`);

    await promisify(fs.writeFile)(certPath, cert.export({
      type: 'pem',
      format: 'pem',
    }));
    await promisify(fs.writeFile)(keyPath, key.export({
      type: 'pkcs8',
      format: 'pem',
    }));

    return {
      cert: cert.export({
        type: 'pem',
        format: 'pem',
      }),
      key: key.export({
        type: 'pkcs8',
        format: 'pem',
      }),
    };
  }

  /**
   * Load a TLS certificate from file.
   * @param {string} domain - The domain of the certificate.
   * @returns {Promise<string>} A promise resolving to the certificate.
   */
  static async loadCertificate(domain) {
    const certPath = path.join(TLSCertificateManager.CERT_DIR, `${domain}.crt`);
    return await promisify(fs.readFile)(certPath, 'utf8');
  }

  /**
   * Load a private key from file.
   * @param {string} domain - The domain of the key.
   * @returns {Promise<string>} A promise resolving to the private key.
   */
  static async loadPrivateKey(domain) {
    const keyPath = path.join(TLSCertificateManager.KEY_DIR, `${domain}.key`);
    return await promisify(fs.readFile)(keyPath, 'utf8');
  }
}

module.exports = TLSCertificateManager;