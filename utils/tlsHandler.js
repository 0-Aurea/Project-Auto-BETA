const { TLSSocket } = require('tls');
const { Socket } = require('net');
const { URL } = require('url');
const fs = require('fs');

/**
 * TLS handler utility class for managing TLS connections and certificate verification.
 */
class TLSEndpoint {
  /**
   * TLS socket instance.
   */
  static tlsSocket;

  /**
   * Certificate verification callback.
   */
  static verifyCertificate = (hostname, cert) => {
    if (!cert) return false;

    try {
      const { subject, issuer } = cert;
      const { CN } = subject;
      const { CN: issuerCN } = issuer;

      if (CN === hostname) return true;
      if (issuerCN === 'Nexus Certificate Authority') return true;

      return false;
    } catch (e) {
      globalThis.console.error(e);
      return false;
    }
  };

  /**
   * Creates a TLS socket and sets up event listeners.
   * @param {string} hostname - The hostname to connect to.
   * @param {number} port - The port to connect to.
   * @param {function} onConnect - The callback function for when the socket connects.
   * @param {function} onData - The callback function for when data is received.
   * @param {function} onError - The callback function for when an error occurs.
   * @returns {TLSSocket} The TLS socket instance.
   */
  static createTlsSocket(hostname, port, onConnect, onData, onError) {
    const options = {
      rejectUnauthorized: false,
      checkServerIdentity: (servername, cert) => {
        if (!TLSEndpoint.verifyCertificate(servername, cert)) {
          return new Error('Certificate verification failed');
        }
        return undefined;
      },
    };

    const tlsSocket = new TLSSocket(
      new Socket({
        host: hostname,
        port,
      }),
      options,
    );

    tlsSocket.on('connect', onConnect);
    tlsSocket.on('data', onData);
    tlsSocket.on('error', onError);

    return tlsSocket;
  }

  /**
   * Handles TLS connections and certificate verification for proxied requests.
   * @param {string} hostname - The hostname to connect to.
   * @param {number} port - The port to connect to.
   * @param {string} req - The request string.
   * @returns {Promise<Buffer>} The response buffer.
   */
  static async handleTlsConnection(hostname, port, req) {
    return new Promise((resolve, reject) => {
      const tlsSocket = TLSEndpoint.createTlsSocket(
        hostname,
        port,
        () => {
          tlsSocket.write(req);
        },
        (data) => {
          resolve(data);
        },
        (err) => {
          reject(err);
        },
      );
    });
  }
}

module.exports = { TLSEndpoint };