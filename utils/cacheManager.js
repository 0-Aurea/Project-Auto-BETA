const { caches } = globalThis;
const { URL } = require('url');

/**
 * Cache manager utility class for handling Service Worker Cache API operations.
 */
class CacheManager {
  /**
   * Cache name for storing proxied responses.
   */
  static CACHE_NAME = 'nexus-cache';

  /**
   * Regular expression to match cacheable response statuses.
   */
  static CACHEABLE_STATUS_REGEX = /^https?:\/\/.*$/;

  /**
   * TTL (time to live) for cache entries in seconds.
   */
  static TTL = 3600; // 1 hour

  /**
   * Cache instance.
   */
  static cache;

  /**
   * Initialize the cache manager.
   */
  static async init() {
    CacheManager.cache = await caches.open(CacheManager.CACHE_NAME);
  }

  /**
   * Checks if a response is cacheable.
   * @param {Response} response - The response to check.
   * @returns {boolean} True if the response is cacheable, false otherwise.
   */
  static isCacheableResponse(response) {
    return CacheManager.CACHEABLE_STATUS_REGEX.test(response.url) && response.status >= 200 && response.status < 300;
  }

  /**
   * Caches a response with a TTL header.
   * @param {Request} request - The request associated with the response.
   * @param {Response} response - The response to cache.
   * @returns {Promise<void>} A promise that resolves when the response is cached.
   */
  static async cacheResponse(request, response) {
    if (!CacheManager.isCacheableResponse(response)) return;

    const cacheEntry = new Response(response.body, response);
    cacheEntry.headers.set('Cache-Control', `public, max-age=${CacheManager.TTL}`);

    await CacheManager.cache.put(request, cacheEntry);
  }

  /**
   * Retrieves a cached response.
   * @param {Request} request - The request to retrieve the cached response for.
   * @returns {Promise<Response|null>} A promise that resolves with the cached response or null if not found.
   */
  static async getCachedResponse(request) {
    const cachedResponse = await CacheManager.cache.match(request);
    return cachedResponse;
  }

  /**
   * Removes a cached response.
   * @param {Request} request - The request to remove the cached response for.
   * @returns {Promise<void>} A promise that resolves when the cached response is removed.
   */
  static async removeCachedResponse(request) {
    await CacheManager.cache.delete(request);
  }

  /**
   * Clears all cached responses.
   * @returns {Promise<void>} A promise that resolves when the cache is cleared.
   */
  static async clearCache() {
    await CacheManager.cache.keys().then(async (keys) => {
      for (const key of keys) {
        await CacheManager.cache.delete(key);
      }
    });
  }
}

export default CacheManager;