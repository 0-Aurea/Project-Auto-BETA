const { performance } = require('perf_hooks');
const { URL } = require('url');

/**
 * Performance utility class for monitoring and optimizing NEXUS performance.
 */
class PerformanceUtils {
  /**
   * Map to store cache metadata for performance analysis.
   */
  static cacheMetadata = new Map();

  /**
   * Map to store request metadata for performance analysis.
   */
  static requestMetadata = new Map();

  /**
   * Tracks the start time of a request.
   * @param {string} requestUrl - The URL of the request.
   */
  static trackRequestStart(requestUrl) {
    const startTime = performance.now();
    PerformanceUtils.requestMetadata.set(requestUrl, { startTime });
  }

  /**
   * Tracks the end time of a request and calculates the duration.
   * @param {string} requestUrl - The URL of the request.
   */
  static trackRequestEnd(requestUrl) {
    const metadata = PerformanceUtils.requestMetadata.get(requestUrl);
    if (!metadata) return;

    const endTime = performance.now();
    const duration = endTime - metadata.startTime;
    metadata.endTime = endTime;
    metadata.duration = duration;
    PerformanceUtils.requestMetadata.set(requestUrl, metadata);
  }

  /**
   * Tracks cache hits and misses.
   * @param {string} cacheKey - The cache key.
   * @param {boolean} isHit - Whether the cache was hit.
   */
  static trackCacheHit(cacheKey, isHit) {
    const metadata = PerformanceUtils.cacheMetadata.get(cacheKey) || { hits: 0, misses: 0 };
    if (isHit) {
      metadata.hits++;
    } else {
      metadata.misses++;
    }
    PerformanceUtils.cacheMetadata.set(cacheKey, metadata);
  }

  /**
   * Calculates the cache hit ratio.
   * @param {string} cacheKey - The cache key.
   * @returns {number} The cache hit ratio.
   */
  static getCacheHitRatio(cacheKey) {
    const metadata = PerformanceUtils.cacheMetadata.get(cacheKey);
    if (!metadata) return 0;

    const total = metadata.hits + metadata.misses;
    if (total === 0) return 0;

    return metadata.hits / total;
  }

  /**
   * Calculates the average request duration.
   * @returns {number} The average request duration.
   */
  static getAverageRequestDuration() {
    const totalDuration = Array.from(PerformanceUtils.requestMetadata.values()).reduce((sum, metadata) => sum + metadata.duration, 0);
    const count = PerformanceUtils.requestMetadata.size;
    if (count === 0) return 0;

    return totalDuration / count;
  }

  /**
   * Clears performance metadata.
   */
  static clearMetadata() {
    PerformanceUtils.cacheMetadata.clear();
    PerformanceUtils.requestMetadata.clear();
  }
}

module.exports = PerformanceUtils;