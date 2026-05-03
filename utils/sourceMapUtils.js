/**
 * Source map utility class for stripping source map URLs to improve security.
 */
class SourceMapUtils {
  /**
   * Regular expression to match source map URLs in JavaScript files.
   */
  static SOURCE_MAP_REGEX = /#\s*sourceMappingURL=([^\s]+)\s*$/m;

  /**
   * Regular expression to match source map URLs in CSS files.
   */
  static CSS_SOURCE_MAP_REGEX = /\/*# sourceMappingURL=([^\s]+)\s*\*\//;

  /**
   * Strip source map URLs from JavaScript code.
   * @param {string} code - The JavaScript code to strip.
   * @returns {string} The JavaScript code with source map URLs stripped.
   */
  static stripJsSourceMap(code) {
    return code.replace(SourceMapUtils.SOURCE_MAP_REGEX, '');
  }

  /**
   * Strip source map URLs from CSS code.
   * @param {string} code - The CSS code to strip.
   * @returns {string} The CSS code with source map URLs stripped.
   */
  static stripCssSourceMap(code) {
    return code.replace(SourceMapUtils.CSS_SOURCE_MAP_REGEX, '');
  }

  /**
   * Check if a URL is a source map URL.
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is a source map URL, false otherwise.
   */
  static isSourceMapUrl(url) {
    return url.endsWith('.map') || url.endsWith('.js.map') || url.endsWith('.css.map');
  }
}

module.exports = SourceMapUtils;