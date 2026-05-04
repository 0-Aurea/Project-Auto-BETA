const { URL } = require('url');
const { JSDOM } = require('jsdom');
const { EncodingUtils } = require('./encoding');
const { UrlUtils } = require('./urlUtils');

/**
 * CSS import rewriter utility class for handling @import statements.
 */
class CSSImportRewriterUtils {
  /**
   * Regular expression to match @import statements.
   */
  static IMPORT_REGEX = /@import\s+['"](.*?)['"]/g;

  /**
   * Regular expression to match url() functions in CSS.
   */
  static URL_FUNCTION_REGEX = /url\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Rewrites @import statements to use the proxied URL.
   * @param {string} css - The CSS to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten CSS.
   */
  static rewriteImports(css, proxiedUrl) {
    return css.replace(CSSImportRewriterUtils.IMPORT_REGEX, (match, importUrl) => {
      const rewrittenImportUrl = UrlUtils.rewriteUrl(importUrl, proxiedUrl);
      return `@import "${rewrittenImportUrl}"`;
    });
  }

  /**
   * Rewrites url() functions in CSS to use the proxied URL.
   * @param {string} css - The CSS to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten CSS.
   */
  static rewriteUrlFunctions(css, proxiedUrl) {
    return css.replace(CSSImportRewriterUtils.URL_FUNCTION_REGEX, (match, url) => {
      const rewrittenUrl = UrlUtils.rewriteUrl(url, proxiedUrl);
      return `url("${rewrittenUrl}")`;
    });
  }

  /**
   * Rewrites CSS content to handle @import statements and url() functions.
   * @param {string} css - The CSS content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten CSS content.
   */
  static rewriteCSS(css, proxiedUrl) {
    css = CSSImportRewriterUtils.rewriteImports(css, proxiedUrl);
    css = CSSImportRewriterUtils.rewriteUrlFunctions(css, proxiedUrl);
    return css;
  }
}

module.exports = CSSImportRewriterUtils;