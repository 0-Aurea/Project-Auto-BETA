const tls = require('tls');
const fs = require('fs');
const crypto = require('crypto');

/**
 * TLS handler utility class for managing TLS connections and certificate management.
 */
class TLSEndpoint {
  /**
   * TLS certificate.
   */
  static certificate = null;

  /**
   * TLS private key.
   */
  static privateKey = null;

  /**
   * Initialize TLS endpoint with certificate and private key.
   * @param {string} certPath - Path to the TLS certificate file.
   * @param {string} keyPath - Path to the TLS private key file.
   */
  static init(certPath, keyPath) {
    TLSEndpoint.certificate = fs.readFileSync(certPath, 'utf8');
    TLSEndpoint.privateKey = fs.readFileSync(keyPath, 'utf8');
  }

  /**
   * Create a TLS server.
   * @param {number} port - The port to listen on.
   * @param {function} onConnection - Callback function for new connections.
   * @returns {tls.Server}
   */
  static createServer(port, onConnection) {
    const server = tls.createServer({
      cert: TLSEndpoint.certificate,
      key: TLSEndpoint.privateKey,
    }, onConnection);

    server.listen(port, () => {
      console.log(`TLS server listening on port ${port}`);
    });

    return server;
  }

  /**
   * Create a TLS client.
   * @param {string} hostname - The hostname to connect to.
   * @param {number} port - The port to connect to.
   * @param {function} onConnect - Callback function for connection establishment.
   * @returns {tls.TLSSocket}
   */
  static createClient(hostname, port, onConnect) {
    const client = tls.connect({
      host: hostname,
      port,
      rejectUnauthorized: false,
    }, onConnect);

    return client;
  }

  /**
   * Generate a self-signed TLS certificate.
   * @param {string} hostname - The hostname to use for the certificate.
   * @param {number} days - The number of days the certificate should be valid for.
   * @returns {{ cert: string, key: string }}
   */
  static generateSelfSignedCertificate(hostname, days) {
    const key = crypto.generateKeyPairSync('rsa', {
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

    const cert = crypto.createCertificate({
      serialNumber: '01',
      validity: {
        notBefore: new Date(),
        notAfter: new Date(Date.now() + (days * 24 * 60 * 60 * 1000)),
      },
      subject: {
        commonName: hostname,
      },
      issuer: {
        commonName: hostname,
      },
      publicKey: key.publicKey,
    });

    cert.sign(key.privateKey, 'sha256');

    return {
      cert: cert.export({
        type: 'pem',
      }),
      key: key.privateKey,
    };
  }
}

module.exports = TLSEndpoint;