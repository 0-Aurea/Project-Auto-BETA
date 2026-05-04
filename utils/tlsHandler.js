const { TLSSocket } = require('tls');
const { Socket } = require('net');
const { EventEmitter } = require('events');

/**
 * TLS handler utility class for handling TLS connections and certificate management.
 */
class TLSEndpoint {
  /**
   * TLS socket instance.
   */
  static tlsSocket;

  /**
   * Certificate authority (CA) certificate.
   */
  static caCertificate;

  /**
   * Private key for the TLS endpoint.
   */
  static privateKey;

  /**
   * TLS endpoint certificate.
   */
  static tlsCertificate;

  /**
   * Initialize the TLS endpoint.
   * @param {object} options - TLS endpoint options.
   */
  static async init(options) {
    TLSEndpoint.caCertificate = options.caCertificate;
    TLSEndpoint.privateKey = options.privateKey;
    TLSEndpoint.tlsCertificate = options.tlsCertificate;

    // Create a TLS socket
    TLSEndpoint.tlsSocket = new TLSSocket(new Socket(), {
      ca: [TLSEndpoint.caCertificate],
      cert: TLSEndpoint.tlsCertificate,
      key: TLSEndpoint.privateKey,
      rejectUnauthorized: true,
    });

    // Handle TLS socket events
    TLSEndpoint.tlsSocket.on('secureConnect', () => {
      console.log('TLS connection established');
    });

    TLSEndpoint.tlsSocket.on('error', (err) => {
      console.error('TLS error:', err);
    });

    TLSEndpoint.tlsSocket.on('close', () => {
      console.log('TLS connection closed');
    });
  }

  /**
   * Handle incoming TLS connections.
   * @param {object} socket - Incoming socket connection.
   */
  static handleConnection(socket) {
    // Upgrade the socket to a TLS socket
    const tlsSocket = new TLSSocket(socket, {
      ca: [TLSEndpoint.caCertificate],
      cert: TLSEndpoint.tlsCertificate,
      key: TLSEndpoint.privateKey,
      rejectUnauthorized: true,
    });

    // Handle TLS socket events
    tlsSocket.on('secureConnect', () => {
      console.log('TLS connection established');
    });

    tlsSocket.on('error', (err) => {
      console.error('TLS error:', err);
    });

    tlsSocket.on('close', () => {
      console.log('TLS connection closed');
    });

    return tlsSocket;
  }

  /**
   * Generate a TLS certificate.
   * @param {object} options - Certificate generation options.
   * @returns {object} The generated TLS certificate.
   */
  static generateCertificate(options) {
    // Generate a private key
    const privateKey = TLSEndpoint.generatePrivateKey();

    // Generate a certificate signing request (CSR)
    const csr = TLSEndpoint.generateCSR(privateKey, options);

    // Sign the CSR with the CA certificate
    const tlsCertificate = TLSEndpoint.signCSR(csr, options);

    return tlsCertificate;
  }

  /**
   * Generate a private key.
   * @returns {object} The generated private key.
   */
  static generatePrivateKey() {
    // Generate a private key using a cryptographically secure pseudo-random number generator
    const crypto = require('crypto');
    const privateKey = crypto.generateKeyPairSync('rsa', {
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
    }).privateKey;

    return privateKey;
  }

  /**
   * Generate a certificate signing request (CSR).
   * @param {object} privateKey - The private key to use for the CSR.
   * @param {object} options - CSR generation options.
   * @returns {object} The generated CSR.
   */
  static generateCSR(privateKey, options) {
    // Generate a CSR using the private key and provided options
    const csr = require('openssl-wrapper').createCSR({
      countryName: options.countryName,
      organizationName: options.organizationName,
      organizationalUnitName: options.organizationalUnitName,
      commonName: options.commonName,
      emailAddress: options.emailAddress,
    }, privateKey);

    return csr;
  }

  /**
   * Sign a certificate signing request (CSR) with the CA certificate.
   * @param {object} csr - The CSR to sign.
   * @param {object} options - Certificate signing options.
   * @returns {object} The signed TLS certificate.
   */
  static signCSR(csr, options) {
    // Sign the CSR with the CA certificate
    const tlsCertificate = require('openssl-wrapper').createCertificate({
      days: options.days,
      csr: csr,
      privateKey: TLSEndpoint.privateKey,
      ca: TLSEndpoint.caCertificate,
    });

    return tlsCertificate;
  }
}

module.exports = TLSEndpoint;