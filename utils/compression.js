const zlib = require('zlib');
const brotli = require('iltorb');

/**
 * Compression utility class for handling Brotli/gzip decompression and re-compression.
 */
class CompressionUtils {
  /**
   * Decompresses a Buffer using gzip or Brotli.
   * @param {Buffer} buffer - The compressed Buffer.
   * @param {string} encoding - The encoding type ('gzip' or 'br').
   * @returns {Promise<Buffer>} The decompressed Buffer.
   */
  static async decompress(buffer, encoding) {
    switch (encoding) {
      case 'gzip':
        return new Promise((resolve, reject) => {
          zlib.gunzip(buffer, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      case 'br':
        return brotli.decompress(buffer);
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
  }

  /**
   * Compresses a Buffer using gzip or Brotli.
   * @param {Buffer} buffer - The Buffer to compress.
   * @param {string} encoding - The encoding type ('gzip' or 'br').
   * @returns {Promise<Buffer>} The compressed Buffer.
   */
  static async compress(buffer, encoding) {
    switch (encoding) {
      case 'gzip':
        return new Promise((resolve, reject) => {
          zlib.gzip(buffer, (err, result) => {
            if (err) reject(err);
            else resolve(result);
          });
        });
      case 'br':
        return brotli.compress(buffer);
      default:
        throw new Error(`Unsupported encoding: ${encoding}`);
    }
  }

  /**
   * Re-compresses a Buffer from one encoding to another.
   * @param {Buffer} buffer - The Buffer to re-compress.
   * @param {string} fromEncoding - The original encoding type ('gzip' or 'br').
   * @param {string} toEncoding - The target encoding type ('gzip' or 'br').
   * @returns {Promise<Buffer>} The re-compressed Buffer.
   */
  static async reCompress(buffer, fromEncoding, toEncoding) {
    const decompressed = await CompressionUtils.decompress(buffer, fromEncoding);
    return CompressionUtils.compress(decompressed, toEncoding);
  }
}

module.exports = CompressionUtils;