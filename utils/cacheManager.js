const { CacheAPI } = require('sw-cache-api');
const { MAX_CACHE_AGE, CACHE_NAME } = require('./constants');

/**
 * Cache Manager utility class for handling cache storage, retrieval, and eviction.
 */
class CacheManager {
  /**
   * Cache storage instance.
   */
  static cache = new CacheAPI(CACHE_NAME);

  /**
   * Cache entry TTL (time to live) in milliseconds.
   */
  static MAX_CACHE_AGE = MAX_CACHE_AGE;

  /**
   * Checks if a cache entry exists and is valid.
   * @param {string} key - The cache key.
   * @returns {Promise<boolean>} True if the cache entry exists and is valid, false otherwise.
   */
  static async isValidCacheEntry(key) {
    const cachedResponse = await CacheManager.cache.match(key);
    if (!cachedResponse) return false;
    const headers = cachedResponse.headers;
    const cacheAge = parseInt(headers.get('age'), 10);
    const ttl = cacheAge ? cacheAge : CacheManager.MAX_CACHE_AGE;
    return Date.now() - cachedResponse.timestamp <= ttl;
  }

  /**
   * Retrieves a cache entry.
   * @param {string} key - The cache key.
   * @returns {Promise<Response>} The cached Response object, or undefined if not found.
   */
  static async getCacheEntry(key) {
    if (await CacheManager.isValidCacheEntry(key)) {
      return CacheManager.cache.match(key);
    } else {
      await CacheManager.removeCacheEntry(key);
      return undefined;
    }
  }

  /**
   * Stores a cache entry.
   * @param {string} key - The cache key.
   * @param {Response} response - The Response object to cache.
   * @returns {Promise<void>}
   */
  static async storeCacheEntry(key, response) {
    await CacheManager.cache.put(key, response);
  }

  /**
   * Removes a cache entry.
   * @param {string} key - The cache key.
   * @returns {Promise<void>}
   */
  static async removeCacheEntry(key) {
    await CacheManager.cache.delete(key);
  }

  /**
   * Clears all cache entries.
   * @returns {Promise<void>}
   */
  static async clearCache() {
    await CacheManager.cache.keys().then(async (keys) => {
      for (const key of keys) {
        await CacheManager.removeCacheEntry(key);
      }
    });
  }
}

module.exports = { CacheManager };