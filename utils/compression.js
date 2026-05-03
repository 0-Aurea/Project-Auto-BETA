const zlib = require('zlib');
const { Buffer } = require('buffer');

/**
 * Compression utility class for managing Brotli/gzip decompression and re-compression.
 */
class CompressionUtils {
  /**
   * Supported compression algorithms.
   */
  static COMPRESSION_ALGORITHMS = {
    'br': 'brotli',
    'gzip': 'gzip',
  };

  /**
   * Decompress a buffer using the specified algorithm.
   * @param {Buffer} buffer - The buffer to decompress.
   * @param {string} algorithm - The compression algorithm (br or gzip).
   * @returns {Promise<Buffer>} The decompressed buffer.
   */
  static async decompress(buffer, algorithm) {
    switch (algorithm) {
      case 'br':
        return new Promise((resolve, reject) => {
          zlib.brotliDecompress(buffer, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      case 'gzip':
        return new Promise((resolve, reject) => {
          zlib.gunzip(buffer, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Compress a buffer using the specified algorithm.
   * @param {Buffer} buffer - The buffer to compress.
   * @param {string} algorithm - The compression algorithm (br or gzip).
   * @returns {Promise<Buffer>} The compressed buffer.
   */
  static async compress(buffer, algorithm) {
    switch (algorithm) {
      case 'br':
        return new Promise((resolve, reject) => {
          zlib.brotliCompress(buffer, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      case 'gzip':
        return new Promise((resolve, reject) => {
          zlib.gzip(buffer, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        });
      default:
        throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }
  }

  /**
   * Decompress and re-compress a buffer using the specified algorithms.
   * @param {Buffer} buffer - The buffer to decompress and re-compress.
   * @param {string} decompressAlgorithm - The decompression algorithm (br or gzip).
   * @param {string} compressAlgorithm - The compression algorithm (br or gzip).
   * @returns {Promise<Buffer>} The re-compressed buffer.
   */
  static async decompressAndCompress(buffer, decompressAlgorithm, compressAlgorithm) {
    const decompressedBuffer = await CompressionUtils.decompress(buffer, decompressAlgorithm);
    return CompressionUtils.compress(decompressedBuffer, compressAlgorithm);
  }
}

module.exports = CompressionUtils;