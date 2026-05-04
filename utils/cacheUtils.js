'use strict';

const zlib = require('zlib');
const brotli = require('ilt-node').brotli;

/**
 * Cache utility functions for handling brotli/gzip decompression and re-compression pipeline.
 */
class CacheUtils {
  /**
   * Decompresses a brotli-compressed buffer.
   * @param {Buffer} buffer - The brotli-compressed buffer.
   * @returns {Promise<Buffer>} A promise resolving to the decompressed buffer.
   */
  static async decompressBrotli(buffer) {
    return new Promise((resolve, reject) => {
      brotli.decompress(buffer, (err, decompressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(decompressed);
        }
      });
    });
  }

  /**
   * Decompresses a gzip-compressed buffer.
   * @param {Buffer} buffer - The gzip-compressed buffer.
   * @returns {Promise<Buffer>} A promise resolving to the decompressed buffer.
   */
  static async decompressGzip(buffer) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, decompressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(decompressed);
        }
      });
    });
  }

  /**
   * Re-compresses a buffer using brotli.
   * @param {Buffer} buffer - The buffer to re-compress.
   * @returns {Promise<Buffer>} A promise resolving to the re-compressed buffer.
   */
  static async recompressBrotli(buffer) {
    return new Promise((resolve, reject) => {
      brotli.compress(buffer, (err, compressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(compressed);
        }
      });
    });
  }

  /**
   * Re-compresses a buffer using gzip.
   * @param {Buffer} buffer - The buffer to re-compress.
   * @returns {Promise<Buffer>} A promise resolving to the re-compressed buffer.
   */
  static async recompressGzip(buffer) {
    return new Promise((resolve, reject) => {
      zlib.gzip(buffer, (err, compressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(compressed);
        }
      });
    });
  }

  /**
   * Decompresses and re-compresses a buffer using the specified algorithm.
   * @param {Buffer} buffer - The buffer to decompress and re-compress.
   * @param {string} algorithm - The algorithm to use (brotli or gzip).
   * @returns {Promise<Buffer>} A promise resolving to the re-compressed buffer.
   */
  static async decompressAndRecompress(buffer, algorithm) {
    let decompressed;
    switch (algorithm) {
      case 'brotli':
        decompressed = await CacheUtils.decompressBrotli(buffer);
        break;
      case 'gzip':
        decompressed = await CacheUtils.decompressGzip(buffer);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    let recompressed;
    switch (algorithm) {
      case 'brotli':
        recompressed = await CacheUtils.recompressBrotli(decompressed);
        break;
      case 'gzip':
        recompressed = await CacheUtils.recompressGzip(decompressed);
        break;
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    return recompressed;
  }
}

module.exports = CacheUtils;