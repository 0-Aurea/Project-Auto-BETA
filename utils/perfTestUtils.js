const { performance } = require('perf_hooks');
const { URL } = require('url');

/**
 * Performance testing utility class for benchmarking the proxy engine.
 */
class PerfTestUtils {
  /**
   * Measures the execution time of a given function.
   * @param {function} fn - The function to measure.
   * @param {...any} args - Function arguments.
   * @returns {Promise<number>} The execution time in milliseconds.
   */
  static async measureExecutionTime(fn, ...args) {
    const startTime = performance.now();
    await fn(...args);
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Generates a random URL for testing.
   * @param {string} domain - The domain for the URL.
   * @param {string} path - The path for the URL.
   * @returns {string} A random URL.
   */
  static generateRandomUrl(domain, path) {
    return new URL(`https://${domain}${path}`).href;
  }

  /**
   * Creates a mock request object for testing.
   * @param {string} url - The URL for the request.
   * @param {string} method - The request method.
   * @param {object} headers - Request headers.
   * @returns {object} A mock request object.
   */
  static createMockRequest(url, method, headers) {
    return {
      url,
      method,
      headers,
    };
  }

  /**
   * Creates a mock response object for testing.
   * @param {number} statusCode - The response status code.
   * @param {object} headers - Response headers.
   * @param {string} body - The response body.
   * @returns {object} A mock response object.
   */
  static createMockResponse(statusCode, headers, body) {
    return {
      statusCode,
      headers,
      body,
    };
  }

  /**
   * Benchmarks the performance of a given function with multiple iterations.
   * @param {function} fn - The function to benchmark.
   * @param {number} iterations - The number of iterations.
   * @param {...any} args - Function arguments.
   * @returns {Promise<{ average: number, median: number }>} The average and median execution times.
   */
  static async benchmarkPerformance(fn, iterations, ...args) {
    const executionTimes = [];

    for (let i = 0; i < iterations; i++) {
      const executionTime = await PerfTestUtils.measureExecutionTime(fn, ...args);
      executionTimes.push(executionTime);
    }

    const averageExecutionTime = executionTimes.reduce((a, b) => a + b, 0) / iterations;
    const sortedExecutionTimes = executionTimes.sort((a, b) => a - b);
    const medianExecutionTime = sortedExecutionTimes.length % 2 === 0
      ? (sortedExecutionTimes[sortedExecutionTimes.length / 2 - 1] + sortedExecutionTimes[sortedExecutionTimes.length / 2]) / 2
      : sortedExecutionTimes[Math.floor(sortedExecutionTimes.length / 2)];

    return { average: averageExecutionTime, median: medianExecutionTime };
  }
}

module.exports = PerfTestUtils;