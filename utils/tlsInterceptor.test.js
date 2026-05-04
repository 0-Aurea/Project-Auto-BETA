const { describe, it, expect } = require('@jest/globals');
const TlsUtils = require('./tlsUtils');
const tls = require('tls');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

describe('TlsUtils', () => {
  describe('createTlsServerContext', () => {
    it('should create a TLS server context', () => {
      const certPath = path.join(__dirname, 'test-cert.crt');
      const keyPath = path.join(__dirname, 'test-key.key');
      const caPath = path.join(__dirname, 'test-ca.crt');

      // Generate test certificates
      const cert = crypto.createCertificate({
        serialNumber: '01',
        validity: {
          notBefore: new Date(),
          notAfter: new Date(Date.now() + 10000),
        },
        subject: {
          C: 'US',
          ST: 'State',
          L: 'Locality',
          O: 'Organization',
          OU: 'Organizational Unit',
          CN: 'test.com',
        },
      });

      fs.writeFileSync(certPath, cert.export({ type: 'spki' }));
      fs.writeFileSync(keyPath, crypto.randomBytes(2048));
      fs.writeFileSync(caPath, cert.export({ type: 'spki' }));

      const tlsServerContext = TlsUtils.createTlsServerContext(certPath, keyPath, caPath);
      expect(tlsServerContext).toBeInstanceOf(tls.TLSServer);
    });

    it('should throw an error if certificate file does not exist', () => {
      expect(() => TlsUtils.createTlsServerContext('non-existent-cert.crt', 'test-key.key', 'test-ca.crt')).toThrow();
    });

    it('should throw an error if private key file does not exist', () => {
      expect(() => TlsUtils.createTlsServerContext('test-cert.crt', 'non-existent-key.key', 'test-ca.crt')).toThrow();
    });

    it('should throw an error if CA certificate file does not exist', () => {
      expect(() => TlsUtils.createTlsServerContext('test-cert.crt', 'test-key.key', 'non-existent-ca.crt')).toThrow();
    });
  });

  describe('TLS Connection', () => {
    it('should establish a TLS connection', (done) => {
      const certPath = path.join(__dirname, 'test-cert.crt');
      const keyPath = path.join(__dirname, 'test-key.key');
      const caPath = path.join(__dirname, 'test-ca.crt');

      // Generate test certificates
      const cert = crypto.createCertificate({
        serialNumber: '01',
        validity: {
          notBefore: new Date(),
          notAfter: new Date(Date.now() + 10000),
        },
        subject: {
          C: 'US',
          ST: 'State',
          L: 'Locality',
          O: 'Organization',
          OU: 'Organizational Unit',
          CN: 'test.com',
        },
      });

      fs.writeFileSync(certPath, cert.export({ type: 'spki' }));
      fs.writeFileSync(keyPath, crypto.randomBytes(2048));
      fs.writeFileSync(caPath, cert.export({ type: 'spki' }));

      const tlsServerContext = TlsUtils.createTlsServerContext(certPath, keyPath, caPath);

      tlsServerContext.listen(8080, () => {
        const client = tls.connect(8080, 'localhost', {
          rejectUnauthorized: false,
        }, (stream) => {
          expect(stream.authorized).toBe(true);
          done();
        });

        client.on('error', (err) => {
          console.error(err);
        });
      });
    });
  });
});