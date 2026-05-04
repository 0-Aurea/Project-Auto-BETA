const { performance } = require('perf_hooks');
const { URL } = require('url');

/**
 * Performance testing utility class for measuring the performance of the proxy engine.
 */
class PerfTestUtils {
  /**
   * Measures the execution time of a given function.
   * @param {function} fn - The function to measure.
   * @returns {function} A wrapper function that measures the execution time.
   */
  static measureExecutionTime(fn) {
    return (...args) => {
      const startTime = performance.now();
      const result = fn(...args);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      globalThis.console.log(`Executed in ${executionTime.toFixed(2)}ms`);
      return result;
    };
  }

  /**
   * Measures the memory usage of a given function.
   * @param {function} fn - The function to measure.
   * @returns {function} A wrapper function that measures the memory usage.
   */
  static measureMemoryUsage(fn) {
    return (...args) => {
      const memBefore = process.memoryUsage().heapUsed;
      const result = fn(...args);
      const memAfter = process.memoryUsage().heapUsed;
      const memoryUsage = memAfter - memBefore;
      globalThis.console.log(`Memory usage: ${memoryUsage.toFixed(2)} bytes`);
      return result;
    };
  }

  /**
   * Generates a random URL for testing.
   * @param {string} domain - The domain to use.
   * @param {string} path - The path to use.
   * @returns {string} A random URL.
   */
  static generateRandomUrl(domain, path) {
    const randomPath = `${path}/${Math.random().toString(36).slice(2, 12)}`;
    return new URL(randomPath, `https://${domain}`).href;
  }

  /**
   * Creates a test workload for the proxy engine.
   * @param {function} proxyFn - The proxy function to test.
   * @param {number} numRequests - The number of requests to make.
   * @param {string} domain - The domain to use.
   * @param {string} path - The path to use.
   */
  static createTestWorkload(proxyFn, numRequests, domain, path) {
    const urls = Array(numRequests).fill().map(() => PerfTestUtils.generateRandomUrl(domain, path));
    return async () => {
      for (const url of urls) {
        await proxyFn(url);
      }
    };
  }

  /**
   * Runs a performance test on the proxy engine.
   * @param {function} testWorkload - The test workload to run.
   */
  static async runPerfTest(testWorkload) {
    const startTime = performance.now();
    await testWorkload();
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    globalThis.console.log(`Test completed in ${executionTime.toFixed(2)}ms`);
  }
}

module.exports = PerfTestUtils;