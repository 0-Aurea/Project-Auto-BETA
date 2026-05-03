const { performance } = require('perf_hooks');
const { CacheUtils } = require('./cache');

/**
 * Statistics utility class for collecting proxy performance metrics and cache statistics.
 */
class StatsUtils {
  /**
   * Cache hit ratio.
   */
  static cacheHitRatio = 0;

  /**
   * Total cache hits.
   */
  static cacheHits = 0;

  /**
   * Total cache misses.
   */
  static cacheMisses = 0;

  /**
   * Total requests proxied.
   */
  static requestsProxied = 0;

  /**
   * Total bytes transferred.
   */
  static bytesTransferred = 0;

  /**
   * Map of cache entries with their respective sizes.
   */
  static cacheEntries = new Map();

  /**
   * Records a cache hit.
   */
  static recordCacheHit() {
    StatsUtils.cacheHits++;
    StatsUtils.updateCacheHitRatio();
  }

  /**
   * Records a cache miss.
   */
  static recordCacheMiss() {
    StatsUtils.cacheMisses++;
    StatsUtils.updateCacheHitRatio();
  }

  /**
   * Updates the cache hit ratio.
   */
  static updateCacheHitRatio() {
    if (StatsUtils.cacheHits + StatsUtils.cacheMisses > 0) {
      StatsUtils.cacheHitRatio = StatsUtils.cacheHits / (StatsUtils.cacheHits + StatsUtils.cacheMisses);
    }
  }

  /**
   * Records a proxied request.
   * @param {number} bytesTransferred - The number of bytes transferred.
   */
  static recordRequest(bytesTransferred) {
    StatsUtils.requestsProxied++;
    StatsUtils.bytesTransferred += bytesTransferred;
  }

  /**
   * Adds a cache entry.
   * @param {string} url - The URL of the cache entry.
   * @param {number} size - The size of the cache entry.
   */
  static addCacheEntry(url, size) {
    StatsUtils.cacheEntries.set(url, size);
  }

  /**
   * Removes a cache entry.
   * @param {string} url - The URL of the cache entry.
   */
  static removeCacheEntry(url) {
    StatsUtils.cacheEntries.delete(url);
  }

  /**
   * Gets the cache statistics.
   * @returns {Object} The cache statistics.
   */
  static getCacheStatistics() {
    return {
      hits: StatsUtils.cacheHits,
      misses: StatsUtils.cacheMisses,
      hitRatio: StatsUtils.cacheHitRatio,
      entries: StatsUtils.cacheEntries.size,
      bytes: Array.from(StatsUtils.cacheEntries.values()).reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Gets the proxy performance metrics.
   * @returns {Object} The proxy performance metrics.
   */
  static getProxyMetrics() {
    return {
      requestsProxied: StatsUtils.requestsProxied,
      bytesTransferred: StatsUtils.bytesTransferred,
      avgBytesTransferred: StatsUtils.requestsProxied > 0 ? StatsUtils.bytesTransferred / StatsUtils.requestsProxied : 0,
    };
  }

  /**
   * Starts measuring the performance of a proxied request.
   * @returns {performance.Mark} The performance mark.
   */
  static startMeasuringRequest() {
    return performance.mark('request-start');
  }

  /**
   * Ends measuring the performance of a proxied request.
   * @param {performance.Mark} mark - The performance mark.
   * @returns {performance.Measure} The performance measure.
   */
  static endMeasuringRequest(mark) {
    performance.mark('request-end');
    return performance.measure('request-duration', mark, 'request-end');
  }
}

module.exports = StatsUtils;