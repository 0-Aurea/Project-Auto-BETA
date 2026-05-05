'use strict';

/**
 * Cache manager utility class for handling caching and cache invalidation.
 */
class CacheManager {
  /**
   * Cache storage.
   */
  static cache = {};

  /**
   * Cache TTL (time to live) in milliseconds.
   */
  static TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Cache entry class.
   */
  static CacheEntry = class {
    /**
     * Constructs a cache entry.
     * @param {string} key - The cache key.
     * @param {*} value - The cache value.
     */
    constructor(key, value) {
      this.key = key;
      this.value = value;
      this.timestamp = Date.now();
    }

    /**
     * Checks if the cache entry is valid (not expired).
     * @returns {boolean} True if the cache entry is valid, false otherwise.
     */
    isValid() {
      return Date.now() - this.timestamp < CacheManager.TTL;
    }
  };

  /**
   * Gets a value from the cache.
   * @param {string} key - The cache key.
   * @returns {*} The cached value, or undefined if not found or expired.
   */
  static get(key) {
    const entry = CacheManager.cache[key];
    if (entry && entry.isValid()) {
      return entry.value;
    }
    delete CacheManager.cache[key];
    return undefined;
  }

  /**
   * Sets a value in the cache.
   * @param {string} key - The cache key.
   * @param {*} value - The cache value.
   */
  static set(key, value) {
    CacheManager.cache[key] = new CacheManager.CacheEntry(key, value);
  }

  /**
   * Invalidates the entire cache.
   */
  static invalidate() {
    CacheManager.cache = {};
  }

  /**
   * Invalidates a specific cache entry.
   * @param {string} key - The cache key.
   */
  static invalidateEntry(key) {
    delete CacheManager.cache[key];
  }
}

module.exports = CacheManager;