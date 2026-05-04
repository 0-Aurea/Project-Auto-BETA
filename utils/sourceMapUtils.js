const { URL } = require('url');

/**
 * Source map utility class for handling source map URL stripping and management.
 */
class SourceMapUtils {
  /**
   * Regular expression to match source map URLs in HTTP headers.
   */
  static SOURCE_MAP_HEADER_REGEX = /(?:x-)?source-map|source-map|x-sourcemap|x-source-map|sourceMappingURL|source-map-url/i;

  /**
   * Regular expression to match source map URLs in JavaScript files.
   */
  static SOURCE_MAP_JS_REGEX = /\/\/[#@] sourceMappingURL=([^\s]+)\s*$/m;

  /**
   * Strips source map URLs from HTTP headers.
   * @param {object} headers - The HTTP headers to strip.
   * @returns {object} The modified HTTP headers.
   */
  static stripSourceMapHeaders(headers) {
    for (const key in headers) {
      if (SourceMapUtils.SOURCE_MAP_HEADER_REGEX.test(key)) {
        delete headers[key];
      }
    }
    return headers;
  }

  /**
   * Strips source map URLs from JavaScript files.
   * @param {string} jsCode - The JavaScript code to strip.
   * @returns {string} The modified JavaScript code.
   */
  static stripSourceMapJs(jsCode) {
    return jsCode.replace(SourceMapUtils.SOURCE_MAP_JS_REGEX, '');
  }

  /**
   * Extracts source map URLs from JavaScript files.
   * @param {string} jsCode - The JavaScript code to extract from.
   * @returns {string|null} The extracted source map URL or null if not found.
   */
  static extractSourceMapJs(jsCode) {
    const match = jsCode.match(SourceMapUtils.SOURCE_MAP_JS_REGEX);
    return match && match[1];
  }

  /**
   * Rewrites source map URLs to ensure they are proxied through the Nexus proxy.
   * @param {string} sourceMapUrl - The source map URL to rewrite.
   * @param {string} baseUrl - The base URL of the proxied resource.
   * @returns {string} The rewritten source map URL.
   */
  static rewriteSourceMapUrl(sourceMapUrl, baseUrl) {
    const url = new URL(sourceMapUrl, baseUrl);
    return url.href;
  }
}

module.exports = SourceMapUtils;