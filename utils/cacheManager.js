const LRU = require('lru-cache');

/**
 * Cache manager utility class for handling caching with LRU eviction policy.
 */
class CacheManager {
  /**
   * Constructor for CacheManager.
   * @param {object} options - Options for the LRU cache.
   */
  constructor(options) {
    this.cache = new LRU(options);
  }

  /**
   * Gets a value from the cache.
   * @param {string} key - The key to retrieve from the cache.
   * @returns {*} The cached value or undefined if not found.
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Sets a value in the cache.
   * @param {string} key - The key to store in the cache.
   * @param {*} value - The value to store in the cache.
   * @param {number} [ttl] - The time to live in milliseconds.
   */
  set(key, value, ttl) {
    this.cache.set(key, value, ttl);
  }

  /**
   * Deletes a value from the cache.
   * @param {string} key - The key to delete from the cache.
   */
  delete(key) {
    this.cache.del(key);
  }

  /**
   * Checks if a key exists in the cache.
   * @param {string} key - The key to check in the cache.
   * @returns {boolean} True if the key exists, false otherwise.
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clears the entire cache.
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Returns the number of items in the cache.
   * @returns {number} The number of items in the cache.
   */
  size() {
    return this.cache.size;
  }
}

module.exports = CacheManager;