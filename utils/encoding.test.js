const assert = require('assert');
const { XORBase64Encoder, RotatingSalt } = require('./encoding');

describe('encoding', () => {
  describe('RotatingSalt', () => {
    it('should generate a new salt', () => {
      const salt = new RotatingSalt();
      assert.ok(salt.getSalt());
    });

    it('should rotate the salt', () => {
      const salt = new RotatingSalt();
      const initialSalt = salt.getSalt();
      salt.rotate();
      assert.notStrictEqual(initialSalt, salt.getSalt());
    });
  });

  describe('XORBase64Encoder', () => {
    it('should encode a string', () => {
      const encoder = new XORBase64Encoder(new RotatingSalt());
      const originalString = 'Hello, World!';
      const encodedString = encoder.encode(originalString);
      assert.ok(encodedString);
    });

    it('should decode a string', () => {
      const encoder = new XORBase64Encoder(new RotatingSalt());
      const originalString = 'Hello, World!';
      const encodedString = encoder.encode(originalString);
      const decodedString = encoder.decode(encodedString);
      assert.strictEqual(originalString, decodedString);
    });

    it('should handle edge cases', () => {
      const encoder = new XORBase64Encoder(new RotatingSalt());
      assert.strictEqual(encoder.decode(''), '');
      assert.strictEqual(encoder.encode(''), '');
    });
  });
});