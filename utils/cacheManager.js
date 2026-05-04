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
    const cacheControl = headers.get('cache-control');
    let ttl = CacheManager.MAX_CACHE_AGE;

    if (cacheControl) {
      const cacheControlDirectives = cacheControl.split(',').map((directive) => directive.trim());
      for (const directive of cacheControlDirectives) {
        if (directive.startsWith('max-age=')) {
          const maxAge = parseInt(directive.substring(8), 10);
          if (!isNaN(maxAge)) {
            ttl = maxAge * 1000;
          }
          break;
        }
      }
    }

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

  /**
   * Prefetches a cache entry.
   * @param {string} key - The cache key.
   * @param {string} url - The URL to prefetch.
   * @returns {Promise<void>}
   */
  static async prefetchCacheEntry(key, url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await CacheManager.storeCacheEntry(key, response.clone());
      }
    } catch (error) {
      globalThis.console.error(`Error prefetching cache entry: ${error}`);
    }
  }

  /**
   * Parses cache control headers to determine the TTL.
   * @param {Headers} headers - The response headers.
   * @returns {number} The TTL in milliseconds.
   */
  static parseCacheControl(headers) {
    const cacheControl = headers.get('cache-control');
    let ttl = CacheManager.MAX_CACHE_AGE;

    if (cacheControl) {
      const cacheControlDirectives = cacheControl.split(',').map((directive) => directive.trim());
      for (const directive of cacheControlDirectives) {
        if (directive.startsWith('max-age=')) {
          const maxAge = parseInt(directive.substring(8), 10);
          if (!isNaN(maxAge)) {
            ttl = maxAge * 1000;
          }
          break;
        }
      }
    }

    return ttl;
  }

  /**
   * Handles cache hits and updates the cache entry.
   * @param {string} key - The cache key.
   * @param {Response} response - The Response object.
   * @returns {Promise<void>}
   */
  static async handleCacheHit(key, response) {
    const ttl = CacheManager.parseCacheControl(response.headers);
    const cachedResponse = await CacheManager.cache.match(key);

    if (cachedResponse) {
      const cacheControl = cachedResponse.headers.get('cache-control');
      const cacheControlDirectives = cacheControl.split(',').map((directive) => directive.trim());

      for (const directive of cacheControlDirectives) {
        if (directive.startsWith('max-age=')) {
          const maxAge = parseInt(directive.substring(8), 10);
          if (!isNaN(maxAge) && maxAge * 1000 < ttl) {
            await CacheManager.removeCacheEntry(key);
            await CacheManager.storeCacheEntry(key, response);
          }
          break;
        }
      }
    } else {
      await CacheManager.storeCacheEntry(key, response);
    }
  }

  /**
   * Handles cache misses and prefetches the resource.
   * @param {string} key - The cache key.
   * @param {string} url - The URL to prefetch.
   * @returns {Promise<void>}
   */
  static async handleCacheMiss(key, url) {
    await CacheManager.prefetchCacheEntry(key, url);
  }
}

module.exports = CacheManager;