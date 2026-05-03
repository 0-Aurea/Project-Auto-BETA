const { caches } = require('worker-data');
const { Cache } = caches;
const { URL } = require('url');
const { performance } = require('perf_hooks');

/**
 * Cache manager utility class for handling cache metadata and optimizing cache performance.
 */
class CacheManager {
  /**
   * Cache instance.
   */
  static cache;

  /**
   * Cache metadata map.
   */
  static cacheMetadata = new Map();

  /**
   * Initialize the cache manager.
   */
  static async init() {
    CacheManager.cache = await caches.open(CACHE_NAME);
  }

  /**
   * Get a cached response.
   * @param {string} requestUrl - The URL of the request.
   * @returns {Promise<Response>} The cached response.
   */
  static async get(requestUrl) {
    const cacheKey = CacheManager.getCacheKey(requestUrl);
    const cachedResponse = await CacheManager.cache.match(cacheKey);
    return cachedResponse;
  }

  /**
   * Set a cached response.
   * @param {string} requestUrl - The URL of the request.
   * @param {Response} response - The response to cache.
   * @returns {Promise<void>}
   */
  static async set(requestUrl, response) {
    const cacheKey = CacheManager.getCacheKey(requestUrl);
    await CacheManager.cache.put(cacheKey, response);
    CacheManager.updateCacheMetadata(requestUrl, response);
  }

  /**
   * Remove a cached response.
   * @param {string} requestUrl - The URL of the request.
   * @returns {Promise<void>}
   */
  static async remove(requestUrl) {
    const cacheKey = CacheManager.getCacheKey(requestUrl);
    await CacheManager.cache.delete(cacheKey);
    CacheManager.cacheMetadata.delete(requestUrl);
  }

  /**
   * Get the cache key for a request.
   * @param {string} requestUrl - The URL of the request.
   * @returns {string} The cache key.
   */
  static getCacheKey(requestUrl) {
    const url = new URL(requestUrl);
    return `${url.protocol}://${url.host}${url.pathname}`;
  }

  /**
   * Update cache metadata.
   * @param {string} requestUrl - The URL of the request.
   * @param {Response} response - The response to cache.
   */
  static updateCacheMetadata(requestUrl, response) {
    const metadata = {
      timestamp: performance.now(),
      ttl: response.headers.get('ttl') || MAX_CACHE_AGE,
    };
    CacheManager.cacheMetadata.set(requestUrl, metadata);
  }

  /**
   * Check if a cached response is valid.
   * @param {string} requestUrl - The URL of the request.
   * @returns {boolean} True if the cached response is valid, false otherwise.
   */
  static isValidCacheEntry(requestUrl) {
    const metadata = CacheManager.cacheMetadata.get(requestUrl);
    if (!metadata) return false;
    const now = performance.now();
    return now - metadata.timestamp < metadata.ttl;
  }

  /**
   * Clear the cache.
   * @returns {Promise<void>}
   */
  static async clear() {
    await CacheManager.cache.keys().then(async (keys) => {
      for (const key of keys) {
        await CacheManager.cache.delete(key);
      }
    });
    CacheManager.cacheMetadata.clear();
  }
}

module.exports = CacheManager;