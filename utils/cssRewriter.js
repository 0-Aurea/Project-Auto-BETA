const { URL } = require('url');

/**
 * CSS rewriter utility class for handling CSS rewriting, including handling url(), @import, and content: url(...).
 */
class CSSRewriterUtils {
  /**
   * Regular expression to match CSS url() functions.
   */
  static URL_REGEX = /url\(([^)]+)\)/gi;

  /**
   * Regular expression to match CSS @import rules.
   */
  static IMPORT_REGEX = /@import\s+["'](.*?)["']/gi;

  /**
   * Regular expression to match CSS content: url() functions.
   */
  static CONTENT_URL_REGEX = /content:\s*url\(([^)]+)\)/gi;

  /**
   * Rewrites CSS url() functions to use the proxy URL.
   * @param {string} css - The CSS string to rewrite.
   * @param {string} proxyUrl - The proxy URL to use.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteUrls(css, proxyUrl) {
    return css.replace(CSSRewriterUtils.URL_REGEX, (match, url) => {
      const absoluteUrl = new URL(url, proxyUrl).href;
      return `url(${proxyUrl}/proxy?url=${encodeURIComponent(absoluteUrl)})`;
    });
  }

  /**
   * Rewrites CSS @import rules to use the proxy URL.
   * @param {string} css - The CSS string to rewrite.
   * @param {string} proxyUrl - The proxy URL to use.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteImports(css, proxyUrl) {
    return css.replace(CSSRewriterUtils.IMPORT_REGEX, (match, importUrl) => {
      const absoluteUrl = new URL(importUrl, proxyUrl).href;
      return `@import "${proxyUrl}/proxy?url=${encodeURIComponent(absoluteUrl)}"`;
    });
  }

  /**
   * Rewrites CSS content: url() functions to use the proxy URL.
   * @param {string} css - The CSS string to rewrite.
   * @param {string} proxyUrl - The proxy URL to use.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteContentUrls(css, proxyUrl) {
    return css.replace(CSSRewriterUtils.CONTENT_URL_REGEX, (match, url) => {
      const absoluteUrl = new URL(url, proxyUrl).href;
      return `content: url(${proxyUrl}/proxy?url=${encodeURIComponent(absoluteUrl)})`;
    });
  }

  /**
   * Rewrites CSS to use the proxy URL for all url() functions, @import rules, and content: url() functions.
   * @param {string} css - The CSS string to rewrite.
   * @param {string} proxyUrl - The proxy URL to use.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteCss(css, proxyUrl) {
    return CSSRewriterUtils.rewriteContentUrls(
      CSSRewriterUtils.rewriteImports(
        CSSRewriterUtils.rewriteUrls(css, proxyUrl),
        proxyUrl
      ),
      proxyUrl
    );
  }
}

module.exports = CSSRewriterUtils;