const { URL } = require('url');

/**
 * CSS import rewriter utility class for handling CSS @import statements.
 */
class CSSImportRewriterUtils {
  /**
   * Regular expression to match CSS @import statements.
   */
  static IMPORT_REGEX = /@import\s+["'](.*?)["']/gi;

  /**
   * Rewriter function for CSS @import statements.
   * @param {string} css - The CSS string to rewrite.
   * @param {string} baseUrl - The base URL for resolving relative imports.
   * @returns {string} The rewritten CSS string.
   */
  static rewrite(css, baseUrl) {
    return css.replace(CSSImportRewriterUtils.IMPORT_REGEX, (match, importUrl) => {
      const absoluteUrl = new URL(importUrl, baseUrl).href;
      return `@import "${absoluteUrl}"`;
    });
  }

  /**
   * Rewriter function for CSS @import statements with URL object.
   * @param {string} css - The CSS string to rewrite.
   * @param {URL} baseUrl - The base URL for resolving relative imports.
   * @returns {string} The rewritten CSS string.
   */
  static rewriteWithUrl(css, baseUrl) {
    return css.replace(CSSImportRewriterUtils.IMPORT_REGEX, (match, importUrl) => {
      const absoluteUrl = new URL(importUrl, baseUrl).href;
      return `@import "${absoluteUrl}"`;
    });
  }

  /**
   * Extracts and rewrites CSS @import statements from a given CSS string.
   * @param {string} css - The CSS string to process.
   * @param {string} baseUrl - The base URL for resolving relative imports.
   * @returns {object} An object containing the rewritten CSS string and a list of imported URLs.
   */
  static processImports(css, baseUrl) {
    const importedUrls = [];
    const rewrittenCss = css.replace(CSSImportRewriterUtils.IMPORT_REGEX, (match, importUrl) => {
      const absoluteUrl = new URL(importUrl, baseUrl).href;
      importedUrls.push(absoluteUrl);
      return `@import "${absoluteUrl}"`;
    });
    return { rewrittenCss, importedUrls };
  }
}

module.exports = CSSImportRewriterUtils;