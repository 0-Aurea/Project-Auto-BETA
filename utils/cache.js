const { caches } = require('worker_threads') ? globalThis : global;
const { CompressionCodec, decompress } = require('ilt zlibjs');
const { Buffer } = require('buffer');

/**
 * Cache utility class for managing the Service Worker Cache API with TTL headers,
 * Brotli/gzip decompression + re-compression pipeline.
 */
class CacheUtils {
  /**
   * Name of the cache store.
   */
  static CACHE_NAME = 'nexus-cache';

  /**
   * Cache instance.
   */
  static cache;

  /**
   * Supported compression algorithms.
   */
  static COMPRESSION_ALGORITHMS = {
    'br': 'brotli',
    'gzip': 'gzip',
  };

  /**
   * Initialize the cache instance.
   * @returns {Promise<void>}
   */
  static async init() {
    CacheUtils.cache = await caches.open(CacheUtils.CACHE_NAME);
  }

  /**
   * Cache response with TTL headers and optional caching headers.
   * @param {Request} request - The request to cache.
   * @param {Response} response - The response to cache.
   * @param {number} ttl - The time to live in seconds.
   * @param {Object} [cachingHeaders] - Optional caching headers.
   * @param {string} [cachingHeaders.cacheControl] - Cache-Control header value.
   * @param {string} [cachingHeaders.expires] - Expires header value.
   * @returns {Promise<void>}
   */
  static async cacheResponse(request, response, ttl, cachingHeaders = {}) {
    if (!CacheUtils.cache) {
      throw new Error('Cache instance not initialized');
    }

    const responseToCache = new Response(response.body, response);
    const headers = responseToCache.headers;

    // Set TTL headers
    headers.append('Cache-Control', cachingHeaders.cacheControl || `max-age=${ttl}`);
    headers.append('Expires', cachingHeaders.expires || new Date(Date.now() + ttl * 1000).toUTCString());

    // Remove certain headers to prevent caching issues
    headers.delete('Set-Cookie');
    headers.delete('Set-Cookie2');

    // Decompress and re-compress response body
    const contentEncoding = headers.get('content-encoding');
    if (contentEncoding && CacheUtils.COMPRESSION_ALGORITHMS[contentEncoding]) {
      const decompressedBody = await decompress(response.body, contentEncoding);
      responseToCache.body = decompressedBody;

      // Re-compress response body
      const reCompressedBody = await CacheUtils.recompressBody(decompressedBody, 'gzip');
      responseToCache.body = reCompressedBody;

      headers.set('content-encoding', 'gzip');
    }

    await CacheUtils.cache.put(request, responseToCache);
  }

  /**
   * Get a cached response.
   * @param {Request} request - The request to retrieve.
   * @returns {Promise<Response|null>} The cached response or null if not found.
   */
  static async getCachedResponse(request) {
    if (!CacheUtils.cache) {
      throw new Error('Cache instance not initialized');
    }

    const cachedResponse = await CacheUtils.cache.match(request);

    if (cachedResponse) {
      const cachedBody = await cachedResponse.arrayBuffer();
      const decompressedBody = await CacheUtils.decompressBody(cachedBody, cachedResponse.headers.get('content-encoding'));

      return new Response(decompressedBody, cachedResponse);
    }

    return null;
  }

  /**
   * Delete a cached response.
   * @param {Request} request - The request to delete.
   * @returns {Promise<void>}
   */
  static async deleteCachedResponse(request) {
    if (!CacheUtils.cache) {
      throw new Error('Cache instance not initialized');
    }

    await CacheUtils.cache.delete(request);
  }

  /**
   * Clear all cached responses.
   * @returns {Promise<void>}
   */
  static async clearCache() {
    if (!CacheUtils.cache) {
      throw new Error('Cache instance not initialized');
    }

    await CacheUtils.cache.keys().then(keys => Promise.all(keys.map(key => CacheUtils.cache.delete(key))));
  }

  /**
   * Check if a request is cacheable.
   * @param {Request} request - The request to check.
   * @returns {boolean} True if the request is cacheable, false otherwise.
   */
  static isCacheableRequest(request) {
    // Check if the request method is cacheable
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return false;
    }

    // Check if the request has a cacheable URL
    if (request.url.startsWith('https://') || request.url.startsWith('http://')) {
      return true;
    }

    return false;
  }

  /**
   * Decompress response body.
   * @param {ArrayBuffer} body - The response body to decompress.
   * @param {string} contentEncoding - The content encoding of the response body.
   * @returns {Promise<Uint8Array>} The decompressed response body.
   */
  static async decompressBody(body, contentEncoding) {
    if (!contentEncoding || !CacheUtils.COMPRESSION_ALGORITHMS[contentEncoding]) {
      return new Uint8Array(body);
    }

    const decompressionAlgorithm = CacheUtils.COMPRESSION_ALGORITHMS[contentEncoding];
    const decompressedBody = await decompress(body, decompressionAlgorithm);

    return decompressedBody;
  }

  /**
   * Re-compress response body.
   * @param {Uint8Array} body - The response body to re-compress.
   * @param {string} contentEncoding - The content encoding to use for re-compression.
   * @returns {Promise<Uint8Array>} The re-compressed response body.
   */
  static async recompressBody(body, contentEncoding) {
    if (!contentEncoding || !CacheUtils.COMPRESSION_ALGORITHMS[contentEncoding]) {
      return body;
    }

    const compressionAlgorithm = CacheUtils.COMPRESSION_ALGORITHMS[contentEncoding];
    const reCompressedBody = await compress(body, compressionAlgorithm);

    return reCompressedBody;
  }
}

async function compress(body, algorithm) {
  return new Promise((resolve, reject) => {
    const encoder = new CompressionCodec(algorithm);
    encoder.compress(body, (err, compressed) => {
      if (err) {
        reject(err);
      } else {
        resolve(compressed);
      }
    });
  });
}

async function decompress(body, algorithm) {
  return new Promise((resolve, reject) => {
    const decoder = new CompressionCodec(algorithm);
    decoder.decompress(body, (err, decompressed) => {
      if (err) {
        reject(err);
      } else {
        resolve(decompressed);
      }
    });
  });
}

module.exports = CacheUtils;