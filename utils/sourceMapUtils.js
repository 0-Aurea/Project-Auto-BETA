const { URL } = require('url');

/**
 * Source map utility class for handling source map URL stripping and improving debugging experience.
 */
class SourceMapUtils {
  /**
   * Regular expression to match source map URLs in HTTP headers.
   */
  static SOURCE_MAP_HEADER_REGEX = /(?:x-)?source-map:\s*(.*)/gi;

  /**
   * Regular expression to match source map URLs in JavaScript files.
   */
  static SOURCE_MAP_JS_REGEX = /\/\/[#@] sourceMappingURL=([^\s]+)/g;

  /**
   * Regular expression to match source map URLs in CSS files.
   */
  static SOURCE_MAP_CSS_REGEX = /\/\*# sourceMappingURL=([^\s]+)\/\*/g;

  /**
   * Strips source map URLs from HTTP headers.
   * @param {object} headers - The HTTP headers object.
   * @returns {object} The modified HTTP headers object with source map URLs stripped.
   */
  static stripSourceMapHeaders(headers) {
    for (const [key, value] of Object.entries(headers)) {
      if (SourceMapUtils.SOURCE_MAP_HEADER_REGEX.test(key)) {
        delete headers[key];
      } else if (SourceMapUtils.SOURCE_MAP_HEADER_REGEX.test(value)) {
        headers[key] = value.replace(SourceMapUtils.SOURCE_MAP_HEADER_REGEX, '');
      }
    }
    return headers;
  }

  /**
   * Strips source map URLs from JavaScript files.
   * @param {string} js - The JavaScript code string.
   * @returns {string} The modified JavaScript code string with source map URLs stripped.
   */
  static stripSourceMapJs(js) {
    return js.replace(SourceMapUtils.SOURCE_MAP_JS_REGEX, '');
  }

  /**
   * Strips source map URLs from CSS files.
   * @param {string} css - The CSS code string.
   * @returns {string} The modified CSS code string with source map URLs stripped.
   */
  static stripSourceMapCss(css) {
    return css.replace(SourceMapUtils.SOURCE_MAP_CSS_REGEX, '');
  }

  /**
   * Checks if a URL is a source map URL.
   * @param {string} url - The URL string to check.
   * @returns {boolean} True if the URL is a source map URL, false otherwise.
   */
  static isSourceMapUrl(url) {
    try {
      const { pathname } = new URL(url);
      return pathname.endsWith('.map') || pathname.endsWith('.js.map') || pathname.endsWith('.css.map');
    } catch (error) {
      return false;
    }
  }
}

module.exports = SourceMapUtils;