const { URL } = require('url');

/**
 * CSS rewriter utility class for handling url(), @import, and content: url(...) cases.
 */
class CssRewriterUtils {
  /**
   * Regular expression to match CSS url() calls.
   */
  static URL_REGEX = /url\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match CSS @import statements.
   */
  static IMPORT_REGEX = /@import\s+['"](.*?)['"]/g;

  /**
   * Regular expression to match CSS content: url(...) statements.
   */
  static CONTENT_URL_REGEX = /content:\s*url\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Rewriter function for CSS url() calls.
   * @param {string} css - The CSS string to rewrite.
   * @param {function} rewriter - The rewriter function for URLs.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteUrl(css, rewriter) {
    return css.replace(CssRewriterUtils.URL_REGEX, (match, url) => {
      const rewrittenUrl = rewriter(url);
      return `url(${rewrittenUrl})`;
    });
  }

  /**
   * Rewriter function for CSS @import statements.
   * @param {string} css - The CSS string to rewrite.
   * @param {function} rewriter - The rewriter function for URLs.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteImport(css, rewriter) {
    return css.replace(CssRewriterUtils.IMPORT_REGEX, (match, url) => {
      const rewrittenUrl = rewriter(url);
      return `@import "${rewrittenUrl}"`;
    });
  }

  /**
   * Rewriter function for CSS content: url(...) statements.
   * @param {string} css - The CSS string to rewrite.
   * @param {function} rewriter - The rewriter function for URLs.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteContentUrl(css, rewriter) {
    return css.replace(CssRewriterUtils.CONTENT_URL_REGEX, (match, url) => {
      const rewrittenUrl = rewriter(url);
      return `content: url(${rewrittenUrl})`;
    });
  }

  /**
   * Rewrite CSS url(), @import, and content: url(...) statements.
   * @param {string} css - The CSS string to rewrite.
   * @param {function} rewriter - The rewriter function for URLs.
   * @returns {string} The rewritten CSS string.
   */
  static rewrite(css, rewriter) {
    css = CssRewriterUtils.rewriteUrl(css, rewriter);
    css = CssRewriterUtils.rewriteImport(css, rewriter);
    css = CssRewriterUtils.rewriteContentUrl(css, rewriter);
    return css;
  }

  /**
   * Helper function to handle base64 encoded URLs.
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is base64 encoded, false otherwise.
   */
  static isBase64Url(url) {
    try {
      const decodedUrl = Buffer.from(url, 'base64').toString('utf8');
      return decodedUrl.startsWith('data:') || decodedUrl.startsWith('http');
    } catch (error) {
      return false;
    }
  }

  /**
   * Rewriter function for CSS url() calls with base64 encoded URLs.
   * @param {string} css - The CSS string to rewrite.
   * @param {function} rewriter - The rewriter function for URLs.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteBase64Url(css, rewriter) {
    return css.replace(CssRewriterUtils.URL_REGEX, (match, url) => {
      if (CssRewriterUtils.isBase64Url(url)) {
        const rewrittenUrl = rewriter(url);
        return `url(${rewrittenUrl})`;
      }
      return match;
    });
  }

  /**
   * Rewrite CSS @import statements with base64 encoded URLs.
   * @param {string} css - The CSS string to rewrite.
   * @param {function} rewriter - The rewriter function for URLs.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteBase64Import(css, rewriter) {
    return css.replace(CssRewriterUtils.IMPORT_REGEX, (match, url) => {
      if (CssRewriterUtils.isBase64Url(url)) {
        const rewrittenUrl = rewriter(url);
        return `@import "${rewrittenUrl}"`;
      }
      return match;
    });
  }

  /**
   * Rewrite CSS content: url(...) statements with base64 encoded URLs.
   * @param {string} css - The CSS string to rewrite.
   * @param {function} rewriter - The rewriter function for URLs.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteBase64ContentUrl(css, rewriter) {
    return css.replace(CssRewriterUtils.CONTENT_URL_REGEX, (match, url) => {
      if (CssRewriterUtils.isBase64Url(url)) {
        const rewrittenUrl = rewriter(url);
        return `content: url(${rewrittenUrl})`;
      }
      return match;
    });
  }
}

module.exports = CssRewriterUtils;