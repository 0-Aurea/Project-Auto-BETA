const tls = require('tls');
const fs = require('fs');
const path = require('path');

/**
 * TLS utility class for handling TLS connections and certificate management.
 */
class TlsUtils {
  /**
   * Create a new TLS server context.
   * @param {string} certPath - The path to the TLS certificate file.
   * @param {string} keyPath - The path to the TLS private key file.
   * @returns {tls.TLSServer} The TLS server context.
   */
  static createTlsServerContext(certPath, keyPath) {
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    const options = {
      cert,
      key,
      rejectUnauthorized: false,
    };
    return tls.createServer(options, (socket) => {
      socket.destroy();
    });
  }

  /**
   * Create a new TLS client context.
   * @param {string} certPath - The path to the TLS certificate file.
   * @param {string} keyPath - The path to the TLS private key file.
   * @returns {tls.TLSSocket} The TLS client context.
   */
  static createTlsClientContext(certPath, keyPath) {
    const cert = fs.readFileSync(certPath, 'utf8');
    const key = fs.readFileSync(keyPath, 'utf8');
    const options = {
      cert,
      key,
      rejectUnauthorized: false,
    };
    return tls.connect(options, () => {});
  }

  /**
   * Generate a new self-signed TLS certificate.
   * @param {string} country - The country code for the certificate.
   * @param {string} organization - The organization name for the certificate.
   * @param {string} commonName - The common name for the certificate.
   * @returns {object} The generated certificate.
   */
  static generateSelfSignedCert(country, organization, commonName) {
    const openssl = require('openssl');
    const cert = openssl.createCertificate({
      country,
      organization,
      commonName,
    });
    return cert;
  }

  /**
   * Save a TLS certificate to a file.
   * @param {object} cert - The certificate to save.
   * @param {string} certPath - The path to save the certificate file.
   * @param {string} keyPath - The path to save the private key file.
   */
  static saveCertToFile(cert, certPath, keyPath) {
    fs.writeFileSync(certPath, cert.export({ type: 'spki' }));
    fs.writeFileSync(keyPath, cert.export({ type: 'pkcs8' }));
  }

  /**
   * Load a TLS certificate from a file.
   * @param {string} certPath - The path to the TLS certificate file.
   * @returns {object} The loaded certificate.
   */
  static loadCertFromFile(certPath) {
    const cert = fs.readFileSync(certPath, 'utf8');
    return cert;
  }

  /**
   * Verify a TLS certificate chain.
   * @param {string} cert - The certificate to verify.
   * @param {string[]} trustedCerts - The list of trusted certificates.
   * @returns {boolean} True if the certificate chain is valid, false otherwise.
   */
  static verifyCertChain(cert, trustedCerts) {
    const verifier = tls.createVerifyServerContext();
    verifier.verify(cert, (err) => {
      if (err) {
        return false;
      }
    });
    return true;
  }
}

module.exports = TlsUtils;