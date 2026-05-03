const { caches } = require('worker_threads') ? globalThis : global;
const { CompressionCodec, decompress } = require('ilt zlibjs');
const { Buffer } = require('buffer');

/**
 * Cache utility class for managing the Service Worker Cache API with TTL headers,
 * Brotli/gzip decompression + re-compression pipeline, and prefetch hints.
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
   * Maximum cache size in bytes.
   */
  static MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB

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

    // Check cache size and evict oldest entries if necessary
    await CacheUtils.checkCacheSize();
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
   * Re-compress a response body.
   * @param {Buffer} body - The response body to re-compress.
   * @param {string} algorithm - The compression algorithm to use.
   * @returns {Promise<Buffer>} The re-compressed response body.
   */
  static async recompressBody(body, algorithm) {
    const compressedBody = await new Promise((resolve, reject) => {
      const zlib = require('zlib');
      zlib.gzip(body, (err, compressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(compressed);
        }
      });
    });

    return compressedBody;
  }

  /**
   * Decompress a response body.
   * @param {Buffer} body - The response body to decompress.
   * @param {string} algorithm - The compression algorithm to use.
   * @returns {Promise<Buffer>} The decompressed response body.
   */
  static async decompressBody(body, algorithm) {
    if (!algorithm) {
      return body;
    }

    const decompressedBody = await decompress(body, algorithm);

    return decompressedBody;
  }

  /**
   * Check cache size and evict oldest entries if necessary.
   * @returns {Promise<void>}
   */
  static async checkCacheSize() {
    const cache = await CacheUtils.cache.keys();
    const cacheSize = await CacheUtils.getCacheSize();

    if (cacheSize > CacheUtils.MAX_CACHE_SIZE) {
      const oldestEntries = await cache.sort((a, b) => a.timestamp - b.timestamp).take(10);

      for (const entry of oldestEntries) {
        await CacheUtils.cache.delete(entry);
      }
    }
  }

  /**
   * Get cache size in bytes.
   * @returns {Promise<number>} The cache size in bytes.
   */
  static async getCacheSize() {
    const cache = await CacheUtils.cache.keys();
    let cacheSize = 0;

    for (const entry of cache) {
      const response = await CacheUtils.cache.match(entry);
      const body = await response.arrayBuffer();
      cacheSize += body.byteLength;
    }

    return cacheSize;
  }

  /**
   * Invalidate cache entries by URL prefix.
   * @param {string} prefix - The URL prefix to invalidate.
   * @returns {Promise<void>}
   */
  static async invalidateCache(prefix) {
    const cache = await CacheUtils.cache.keys();
    const entriesToRemove = [];

    for (const entry of cache) {
      if (entry.url.startsWith(prefix)) {
        entriesToRemove.push(entry);
      }
    }

    for (const entry of entriesToRemove) {
      await CacheUtils.cache.delete(entry);
    }
  }
}

module.exports = { CacheUtils };