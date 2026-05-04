const { performance } = require('perf_hooks');

/**
 * Performance Monitor utility class for monitoring performance metrics and optimizing the proxy.
 */
class PerformanceMonitor {
  /**
   * Map to store performance metrics.
   */
  static metrics = new Map();

  /**
   * Start measuring a performance metric.
   * @param {string} name - The name of the metric.
   */
  static startMetric(name) {
    if (PerformanceMonitor.metrics.has(name)) {
      throw new Error(`Metric ${name} already exists.`);
    }
    PerformanceMonitor.metrics.set(name, performance.now());
  }

  /**
   * End measuring a performance metric and calculate the duration.
   * @param {string} name - The name of the metric.
   * @returns {number} The duration of the metric in milliseconds.
   */
  static endMetric(name) {
    if (!PerformanceMonitor.metrics.has(name)) {
      throw new Error(`Metric ${name} does not exist.`);
    }
    const startTime = PerformanceMonitor.metrics.get(name);
    const duration = performance.now() - startTime;
    PerformanceMonitor.metrics.delete(name);
    return duration;
  }

  /**
   * Get the duration of a performance metric.
   * @param {string} name - The name of the metric.
   * @returns {number|null} The duration of the metric in milliseconds, or null if the metric does not exist.
   */
  static getMetricDuration(name) {
    if (!PerformanceMonitor.metrics.has(name)) {
      return null;
    }
    return performance.now() - PerformanceMonitor.metrics.get(name);
  }

  /**
   * Clear all performance metrics.
   */
  static clearMetrics() {
    PerformanceMonitor.metrics.clear();
  }
}

module.exports = PerformanceMonitor;