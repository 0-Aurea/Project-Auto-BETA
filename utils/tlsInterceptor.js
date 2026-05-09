const { TLSSocket } = require('tls');
const { Socket } = require('net');
const { createServer } = require('https');
const { Certificate, createDecipheriv, createCipheriv } = require('crypto');

/**
 * TLS interceptor utility class for handling TLS interception and decryption.
 */
class TLSInterceptor {
  /**
   * Creates a new TLS interceptor instance.
   * @param {Object} options - The TLS interceptor options.
   * @param {String} options.key - The private key.
   * @param {String} options.cert - The certificate.
   */
  constructor(options) {
    this.options = options;
    this.server = createServer(options, (socket) => {
      this.handleSocket(socket);
    });
    this.sessionCache = new Map();
    this.cipherCache = new Map();
    this.targetSockets = new Map();
  }

  /**
   * Handles a TLS socket.
   * @param {TLSSocket} socket - The TLS socket.
   */
  handleSocket(socket) {
    socket.on('data', async (data) => {
      try {
        const { decryptedData, encryptedData } = await this.decrypt(data, socket);
        // Handle decrypted data
        globalThis.console.log(decryptedData.toString());

        // Forward decrypted data to the target server
        const targetSocket = this.getTargetSocket(socket);
        if (targetSocket) {
          targetSocket.write(encryptedData);
        }
      } catch (error) {
        globalThis.console.error('Error decrypting data:', error);
      }
    });

    socket.on('end', () => {
      socket.destroy();
      this.sessionCache.delete(socket);
      this.cipherCache.delete(socket);
      this.targetSockets.delete(socket);
    });

    socket.on('error', (error) => {
      globalThis.console.error('Error handling socket:', error);
    });

    socket.on('tlsClientHello', () => {
      const sessionId = socket.getSession();
      if (sessionId) {
        const cachedSession = this.sessionCache.get(sessionId);
        if (cachedSession) {
          socket.setSession(cachedSession);
        }
      }
    });

    socket.on('newSession', (session) => {
      const sessionId = socket.getSession();
      if (sessionId) {
        this.sessionCache.set(sessionId, session);
      }
    });
  }

  /**
   * Decrypts TLS data.
   * @param {Buffer} data - The data to decrypt.
   * @param {TLSSocket} socket - The TLS socket.
   * @returns {Promise<{ decryptedData: Buffer, encryptedData: Buffer }>} 
   *   The decrypted data and the encrypted data to forward to the target server.
   */
  async decrypt(data, socket) {
    const cipherName = this.getCipher(socket);
    const decipher = createDecipheriv(cipherName, null, { authTagLength: 16 });
    decipher.setAutoPadding(true);

    const encryptedData = Buffer.alloc(data.length);
    const decryptedData = Buffer.alloc(data.length);

    let offset = 0;
    while (offset < data.length) {
      const chunkSize = Math.min(4096, data.length - offset);
      const chunk = data.slice(offset, offset + chunkSize);
      offset += chunkSize;

      try {
        decipher.write(chunk);
        const decryptedChunk = decipher.read();
        if (decryptedChunk) {
          decryptedData.write(decryptedChunk, offset - chunkSize);
        }
      } catch (err) {
        throw err;
      }
    }

    return { decryptedData, encryptedData: data };
  }

  /**
   * Gets the cipher for a socket.
   * @param {TLSSocket} socket - The TLS socket.
   * @returns {String} The cipher name.
   */
  getCipher(socket) {
    const cipherName = socket.getCipher();
    if (!cipherName) {
      throw new Error('No cipher found for socket');
    }

    if (!this.cipherCache.has(socket)) {
      this.cipherCache.set(socket, cipherName);
    }

    return cipherName;
  }

  /**
   * Gets the target socket for a socket.
   * @param {TLSSocket} socket - The TLS socket.
   * @returns {Socket} The target socket.
   */
  getTargetSocket(socket) {
    if (this.targetSockets.has(socket)) {
      return this.targetSockets.get(socket);
    }

    const targetSocket = new Socket();
    targetSocket.connect(443, 'example.com', () => {
      this.targetSockets.set(socket, targetSocket);
    });

    targetSocket.on('data', (data) => {
      const encryptedData = Buffer.alloc(data.length);
      data.copy(encryptedData);
      socket.write(encryptedData);
    });

    targetSocket.on('error', (error) => {
      globalThis.console.error('Error with target socket:', error);
    });

    return targetSocket;
  }

  /**
   * Starts the TLS interceptor server.
   */
  start() {
    this.server.listen(443, () => {
      globalThis.console.log('TLS interceptor server started on port 443');
    });
  }

  /**
   * Stops the TLS interceptor server.
   */
  stop() {
    this.server.close();
  }
}

module.exports = TLSInterceptor;