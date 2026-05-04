const { performance } = require('perf_hooks');
const { setTimeout, clearTimeout } = require('timers');

/**
 * Performance monitor utility class for monitoring and analyzing performance metrics.
 */
class PerformanceMonitor {
  /**
   * Performance metrics object.
   */
  static metrics = {};

  /**
   * Timer for tracking duration of events.
   */
  static timers = {};

  /**
   * Start tracking a performance metric.
   * @param {string} eventName - The name of the event to track.
   */
  static startTracking(eventName) {
    if (!PerformanceMonitor.timers[eventName]) {
      PerformanceMonitor.timers[eventName] = performance.now();
      PerformanceMonitor.metrics[eventName] = {
        startTime: PerformanceMonitor.timers[eventName],
        duration: 0,
      };
    }
  }

  /**
   * Stop tracking a performance metric.
   * @param {string} eventName - The name of the event to stop tracking.
   */
  static stopTracking(eventName) {
    if (PerformanceMonitor.timers[eventName]) {
      const endTime = performance.now();
      PerformanceMonitor.metrics[eventName].duration = endTime - PerformanceMonitor.timers[eventName];
      delete PerformanceMonitor.timers[eventName];
    }
  }

  /**
   * Get the performance metrics for a specific event.
   * @param {string} eventName - The name of the event to retrieve metrics for.
   * @returns {Object} The performance metrics for the specified event.
   */
  static getMetrics(eventName) {
    return PerformanceMonitor.metrics[eventName];
  }

  /**
   * Reset all performance metrics.
   */
  static resetMetrics() {
    PerformanceMonitor.metrics = {};
    PerformanceMonitor.timers = {};
  }

  /**
   * Log performance metrics to the console.
   */
  static logMetrics() {
    globalThis.console.log('Performance Metrics:');
    Object.keys(PerformanceMonitor.metrics).forEach((eventName) => {
      const metrics = PerformanceMonitor.metrics[eventName];
      globalThis.console.log(`  ${eventName}:`);
      globalThis.console.log(`    Start Time: ${metrics.startTime}`);
      globalThis.console.log(`    Duration: ${metrics.duration}ms`);
    });
  }
}

/**
 * Automatically log performance metrics at a specified interval.
 * @param {number} interval - The interval in milliseconds to log metrics.
 */
function autoLogMetrics(interval) {
  const logMetricsTimeout = setTimeout(() => {
    PerformanceMonitor.logMetrics();
    autoLogMetrics(interval);
  }, interval);

  return logMetricsTimeout;
}

// Example usage:
const logMetricsInterval = 60000; // Log metrics every 1 minute
const logMetricsTimeout = autoLogMetrics(logMetricsInterval);

// Stop logging metrics after 5 minutes
setTimeout(() => {
  clearTimeout(logMetricsTimeout);
}, 300000);