const { performance } = require('perf_hooks');
const { URL } = require('url');

/**
 * Proxy logger and error reporting utility class.
 */
class ProxyLogger {
  /**
   * Log level enum.
   */
  static LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    CRITICAL: 'critical',
  };

  /**
   * Current log level.
   */
  static logLevel = ProxyLogger.LOG_LEVELS.INFO;

  /**
   * Log timestamp format.
   */
  static logTimestampFormat = 'YYYY-MM-DD HH:mm:ss';

  /**
   * Formats a log message with a timestamp.
   * @param {string} message - The log message.
   * @returns {string} The formatted log message.
   */
  static formatLogMessage(message) {
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return `[${timestamp}] ${message}`;
  }

  /**
   * Logs a debug message.
   * @param {string} message - The log message.
   */
  static debug(message) {
    if (ProxyLogger.logLevel === ProxyLogger.LOG_LEVELS.DEBUG) {
      console.log(ProxyLogger.formatLogMessage(`[DEBUG] ${message}`));
    }
  }

  /**
   * Logs an info message.
   * @param {string} message - The log message.
   */
  static info(message) {
    console.log(ProxyLogger.formatLogMessage(`[INFO] ${message}`));
  }

  /**
   * Logs a warning message.
   * @param {string} message - The log message.
   */
  static warn(message) {
    console.warn(ProxyLogger.formatLogMessage(`[WARN] ${message}`));
  }

  /**
   * Logs an error message.
   * @param {string} message - The log message.
   * @param {Error} [error] - Optional error object.
   */
  static error(message, error) {
    console.error(ProxyLogger.formatLogMessage(`[ERROR] ${message}`));
    if (error) {
      console.error(error.stack);
    }
  }

  /**
   * Logs a critical message.
   * @param {string} message - The log message.
   * @param {Error} [error] - Optional error object.
   */
  static critical(message, error) {
    console.error(ProxyLogger.formatLogMessage(`[CRITICAL] ${message}`));
    if (error) {
      console.error(error.stack);
    }
  }

  /**
   * Tracks a request error.
   * @param {string} requestUrl - The URL of the request.
   * @param {Error} error - The error object.
   */
  static trackRequestError(requestUrl, error) {
    const requestMetadata = {
      url: requestUrl,
      error: error.message,
      timestamp: performance.now(),
    };
    // Add request metadata to a log or database for analysis
  }

  /**
   * Tracks a proxy error.
   * @param {string} errorMessage - The error message.
   * @param {Error} error - The error object.
   */
  static trackProxyError(errorMessage, error) {
    const proxyErrorMetadata = {
      error: errorMessage,
      timestamp: performance.now(),
    };
    if (error) {
      proxyErrorMetadata.stack = error.stack;
    }
    // Add proxy error metadata to a log or database for analysis
  }
}

module.exports = ProxyLogger;