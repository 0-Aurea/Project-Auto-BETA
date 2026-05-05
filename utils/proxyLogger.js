const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

/**
 * Proxy logger utility class for handling logging and error reporting.
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
  };

  /**
   * Current log level.
   */
  static logLevel = ProxyLogger.LOG_LEVELS.INFO;

  /**
   * Logger instance.
   */
  static logger;

  /**
   * Initializes the proxy logger with a custom logger instance or defaults to console logging.
   * @param {object} [logger] - A custom logger instance.
   */
  static init(logger) {
    if (logger) {
      ProxyLogger.logger = logger;
    } else {
      ProxyLogger.logger = console;
    }

    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }
  }

  /**
   * Logs a debug message.
   * @param {string} message - The log message.
   * @param {object} [meta] - Additional metadata to log.
   */
  static debug(message, meta) {
    if (ProxyLogger.logLevel === ProxyLogger.LOG_LEVELS.DEBUG) {
      const logMessage = `${new Date().toISOString()} [DEBUG] ${message}`;
      ProxyLogger.logger.debug(logMessage, meta);
      ProxyLogger.writeToLogFile('debug.log', logMessage, meta);
    }
  }

  /**
   * Logs an info message.
   * @param {string} message - The log message.
   * @param {object} [meta] - Additional metadata to log.
   */
  static info(message, meta) {
    const logMessage = `${new Date().toISOString()} [INFO] ${message}`;
    ProxyLogger.logger.info(logMessage, meta);
    ProxyLogger.writeToLogFile('info.log', logMessage, meta);
  }

  /**
   * Logs a warning message.
   * @param {string} message - The log message.
   * @param {object} [meta] - Additional metadata to log.
   */
  static warn(message, meta) {
    const logMessage = `${new Date().toISOString()} [WARN] ${message}`;
    ProxyLogger.logger.warn(logMessage, meta);
    ProxyLogger.writeToLogFile('warn.log', logMessage, meta);
  }

  /**
   * Logs an error message.
   * @param {string} message - The log message.
   * @param {object} [meta] - Additional metadata to log.
   * @param {Error} [error] - The error object.
   */
  static error(message, meta, error) {
    const logMessage = `${new Date().toISOString()} [ERROR] ${message}`;
    ProxyLogger.logger.error(logMessage, meta, error);
    ProxyLogger.writeToLogFile('error.log', logMessage, meta, error);
  }

  /**
   * Writes a log message to a file.
   * @param {string} fileName - The log file name.
   * @param {string} message - The log message.
   * @param {object} [meta] - Additional metadata to log.
   * @param {Error} [error] - The error object.
   */
  static writeToLogFile(fileName, message, meta, error) {
    const logFilePath = path.join(__dirname, '../logs', fileName);
    const logEntry = `${message}\n${JSON.stringify(meta, null, 2)}\n${error ? error.stack : ''}\n`;
    fs.appendFileSync(logFilePath, logEntry);
  }

  /**
   * Measures the performance of a function.
   * @param {function} fn - The function to measure.
   * @returns {function} A wrapper function that measures performance.
   */
  static measurePerformance(fn) {
    return (...args) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      ProxyLogger.debug(`Function ${fn.name} took ${end - start}ms to execute.`);
      return result;
    };
  }
}

module.exports = ProxyLogger;