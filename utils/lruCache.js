class LRUCache {
  /**
   * Constructor for LRUCache.
   * @param {number} capacity - The maximum number of items the cache can hold.
   */
  constructor(capacity) {
    if (capacity <= 0) {
      throw new Error('Capacity must be a positive integer.');
    }

    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Get a value from the cache.
   * @param {string} key - The key to retrieve.
   * @returns {*} The cached value or undefined if not found.
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // Move to end to mark as recently used
    return value;
  }

  /**
   * Set a value in the cache.
   * @param {string} key - The key to set.
   * @param {*} value - The value to cache.
   * @returns {void}
   */
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove the least recently used item (the first item in the Map)
      const leastRecentlyUsedKey = this.cache.keys().next().value;
      this.cache.delete(leastRecentlyUsedKey);
    }

    this.cache.set(key, value);
  }

  /**
   * Delete a key from the cache.
   * @param {string} key - The key to delete.
   * @returns {void}
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache.
   * @returns {void}
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get the size of the cache.
   * @returns {number} The number of items in the cache.
   */
  size() {
    return this.cache.size;
  }
}

module.exports = LRUCache;