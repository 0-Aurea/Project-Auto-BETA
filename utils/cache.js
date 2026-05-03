const { caches } = require('worker_threads') ? globalThis : global;

/**
 * Cache utility class for managing the Service Worker Cache API.
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

    return cachedResponse;
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
}

module.exports = CacheUtils;