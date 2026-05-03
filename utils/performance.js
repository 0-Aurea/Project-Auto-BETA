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
   * @param {string} [requestId] - Optional request ID for tracking.
   */
  static trackRequestStart(requestUrl, requestId) {
    const startTime = performance.now();
    const metadata = { startTime, requestId };
    PerformanceUtils.requestMetadata.set(requestUrl, metadata);
  }

  /**
   * Tracks the end time of a request and calculates the duration.
   * @param {string} requestUrl - The URL of the request.
   * @param {Object} [options] - Optional settings for detailed tracking.
   * @param {boolean} [options.recordResponseSize] - Track response size.
   * @param {number} [options.responseSize] - Response size in bytes.
   */
  static trackRequestEnd(requestUrl, options = {}) {
    const metadata = PerformanceUtils.requestMetadata.get(requestUrl);
    if (!metadata) return;

    const endTime = performance.now();
    const duration = endTime - metadata.startTime;
    metadata.endTime = endTime;
    metadata.duration = duration;

    if (options.recordResponseSize) {
      metadata.responseSize = options.responseSize;
    }

    PerformanceUtils.requestMetadata.set(requestUrl, metadata);
  }

  /**
   * Tracks cache hits and misses.
   * @param {string} cacheKey - The cache key.
   * @param {boolean} isHit - Whether the cache was hit.
   * @param {number} [responseSize] - Response size in bytes for cache hit.
   */
  static trackCacheHit(cacheKey, isHit, responseSize) {
    const metadata = PerformanceUtils.cacheMetadata.get(cacheKey) || { hits: 0, misses: 0, totalResponseSize: 0 };
    if (isHit) {
      metadata.hits++;
      metadata.totalResponseSize += responseSize || 0;
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
   * @param {string} [filterUrl] - Filter requests by URL.
   * @returns {number} The average request duration.
   */
  static getAverageRequestDuration(filterUrl) {
    const filteredMetadata = Array.from(PerformanceUtils.requestMetadata.entries())
      .filter(([url]) => url.includes(filterUrl))
      .map(([url, metadata]) => metadata);

    const totalDuration = filteredMetadata.reduce((sum, metadata) => sum + metadata.duration, 0);
    const count = filteredMetadata.length;
    if (count === 0) return 0;

    return totalDuration / count;
  }

  /**
   * Calculates the cache efficiency (hit ratio * average response size).
   * @returns {number} The cache efficiency.
   */
  static getCacheEfficiency() {
    const totalHits = Array.from(PerformanceUtils.cacheMetadata.values()).reduce((sum, metadata) => sum + metadata.hits, 0);
    const totalMisses = Array.from(PerformanceUtils.cacheMetadata.values()).reduce((sum, metadata) => sum + metadata.misses, 0);
    const totalResponseSize = Array.from(PerformanceUtils.cacheMetadata.values()).reduce((sum, metadata) => sum + metadata.totalResponseSize, 0);

    if (totalHits + totalMisses === 0) return 0;

    const cacheHitRatio = totalHits / (totalHits + totalMisses);
    return cacheHitRatio * (totalResponseSize / (totalHits + totalMisses));
  }

  /**
   * Clears performance metadata.
   */
  static clearMetadata() {
    PerformanceUtils.cacheMetadata.clear();
    PerformanceUtils.requestMetadata.clear();
  }

  /**
   * Generates a performance report.
   * @returns {Object} Performance report data.
   */
  static getPerformanceReport() {
    const cacheHitRatios = Array.from(PerformanceUtils.cacheMetadata.entries())
      .map(([cacheKey, metadata]) => ({
        cacheKey,
        hitRatio: PerformanceUtils.getCacheHitRatio(cacheKey),
      }));

    const requestDurations = Array.from(PerformanceUtils.requestMetadata.entries())
      .map(([requestUrl, metadata]) => ({
        requestUrl,
        duration: metadata.duration,
      }));

    return {
      cacheHitRatios,
      requestDurations,
      averageRequestDuration: PerformanceUtils.getAverageRequestDuration(),
      cacheEfficiency: PerformanceUtils.getCacheEfficiency(),
    };
  }
}

module.exports = PerformanceUtils;