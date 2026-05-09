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
   * @param {Object} [options] - Optional parameters for the metric.
   * @param {string} [options.description] - A description of the metric.
   */
  static startMetric(name, options = {}) {
    if (PerformanceMonitor.metrics.has(name)) {
      throw new Error(`Metric ${name} already exists.`);
    }
    PerformanceMonitor.metrics.set(name, {
      startTime: performance.now(),
      description: options.description,
    });
  }

  /**
   * End measuring a performance metric and calculate the duration.
   * @param {string} name - The name of the metric.
   * @returns {Object} An object containing the duration and other metadata of the metric.
   */
  static endMetric(name) {
    if (!PerformanceMonitor.metrics.has(name)) {
      throw new Error(`Metric ${name} does not exist.`);
    }
    const metric = PerformanceMonitor.metrics.get(name);
    const duration = performance.now() - metric.startTime;
    PerformanceMonitor.metrics.delete(name);
    return {
      duration,
      description: metric.description,
    };
  }

  /**
   * Get the duration of a performance metric.
   * @param {string} name - The name of the metric.
   * @returns {Object|null} An object containing the duration and other metadata of the metric, or null if the metric does not exist.
   */
  static getMetric(name) {
    if (!PerformanceMonitor.metrics.has(name)) {
      return null;
    }
    const metric = PerformanceMonitor.metrics.get(name);
    return {
      duration: performance.now() - metric.startTime,
      description: metric.description,
    };
  }

  /**
   * Clear all performance metrics.
   */
  static clearMetrics() {
    PerformanceMonitor.metrics.clear();
  }

  /**
   * Get a snapshot of all performance metrics.
   * @returns {Object[]} An array of objects containing the duration and other metadata of all metrics.
   */
  static getMetricsSnapshot() {
    const snapshot = [];
    for (const [name, metric] of PerformanceMonitor.metrics) {
      snapshot.push({
        name,
        duration: performance.now() - metric.startTime,
        description: metric.description,
      });
    }
    return snapshot;
  }
}

module.exports = PerformanceMonitor;