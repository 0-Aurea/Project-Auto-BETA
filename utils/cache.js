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
  static cache = caches.open(CacheUtils.CACHE_NAME);

  /**
   * Cache response with TTL headers.
   * @param {Request} request - The request to cache.
   * @param {Response} response - The response to cache.
   * @param {number} ttl - The time to live in seconds.
   * @returns {Promise<void>}
   */
  static async cacheResponse(request, response, ttl) {
    const cache = await CacheUtils.cache;
    const responseToCache = new Response(response.body, response);
    const headers = responseToCache.headers;

    // Set TTL headers
    headers.append('Cache-Control', `max-age=${ttl}`);
    headers.append('Expires', new Date(Date.now() + ttl * 1000).toUTCString());

    await cache.put(request, responseToCache);
  }

  /**
   * Get a cached response.
   * @param {Request} request - The request to retrieve.
   * @returns {Promise<Response|null>} The cached response or null if not found.
   */
  static async getCachedResponse(request) {
    const cache = await CacheUtils.cache;
    const cachedResponse = await cache.match(request);

    return cachedResponse;
  }

  /**
   * Delete a cached response.
   * @param {Request} request - The request to delete.
   * @returns {Promise<void>}
   */
  static async deleteCachedResponse(request) {
    const cache = await CacheUtils.cache;
    await cache.delete(request);
  }

  /**
   * Clear all cached responses.
   * @returns {Promise<void>}
   */
  static async clearCache() {
    const cache = await CacheUtils.cache;
    await cache.keys().then(keys => Promise.all(keys.map(key => cache.delete(key))));
  }
}

module.exports = CacheUtils;