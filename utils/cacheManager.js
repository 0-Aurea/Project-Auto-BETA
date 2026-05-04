const { CacheAPI } = require('sw-cache-api');
const { MAX_CACHE_AGE, CACHE_NAME } = require('./constants');
const { HeaderRewriterUtils } = require('./headerRewriter');

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
    const clonedResponse = response.clone();
    const rewrittenHeaders = HeaderRewriterUtils.rewriteResponseHeaders(clonedResponse.headers);
    clonedResponse.headers = rewrittenHeaders;
    await CacheManager.cache.put(key, clonedResponse);
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
   * Parses cache control headers and determines the TTL for a cache entry.
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
   * Caches a response with a TTL based on the cache control headers.
   * @param {string} key - The cache key.
   * @param {Response} response - The Response object to cache.
   * @returns {Promise<void>}
   */
  static async cacheResponseWithTTL(key, response) {
    const ttl = CacheManager.parseCacheControl(response.headers);
    const cachedResponse = new Response(response.body, response);
    cachedResponse.timestamp = Date.now();
    cachedResponse.ttl = ttl;
    await CacheManager.storeCacheEntry(key, cachedResponse);
  }
}

module.exports = CacheManager;