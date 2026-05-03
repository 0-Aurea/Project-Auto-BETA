const { URL } = require('url');

/**
 * CSS import rewriter utility class for handling @import statements and url() functions.
 */
class CssImportRewriter {
  /**
   * Regular expression to match @import statements.
   */
  static IMPORT_REGEX = /@import\s+['"]([^'"]+)['"]/g;

  /**
   * Regular expression to match url() functions.
   */
  static URL_REGEX = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;

  /**
   * Rewrites CSS imports to ensure they are proxied through the Nexus proxy.
   * @param {string} css - The CSS code to rewrite.
   * @param {string} baseUrl - The base URL of the proxied resource.
   * @returns {string} The rewritten CSS code.
   */
  static rewriteImports(css, baseUrl) {
    return css.replace(CssImportRewriter.IMPORT_REGEX, (match, importUrl) => {
      const absoluteUrl = new URL(importUrl, baseUrl).href;
      return `@import "${CssImportRewriter.rewriteUrl(absoluteUrl, baseUrl)}";`;
    });
  }

  /**
   * Rewrites url() functions in CSS to ensure they are proxied through the Nexus proxy.
   * @param {string} css - The CSS code to rewrite.
   * @param {string} baseUrl - The base URL of the proxied resource.
   * @returns {string} The rewritten CSS code.
   */
  static rewriteUrls(css, baseUrl) {
    return css.replace(CssImportRewriter.URL_REGEX, (match, url) => {
      const absoluteUrl = new URL(url, baseUrl).href;
      return `url("${CssImportRewriter.rewriteUrl(absoluteUrl, baseUrl)}")`;
    });
  }

  /**
   * Rewrites a URL to be proxied through the Nexus proxy.
   * @param {string} url - The URL to rewrite.
   * @param {string} baseUrl - The base URL of the proxied resource.
   * @returns {string} The rewritten URL.
   */
  static rewriteUrl(url, baseUrl) {
    // Implement URL rewriting logic here
    // For example, using XOR + base64 URL encoding with a rotating salt
    return url; // TO DO: implement rewriting logic
  }

  /**
   * Rewrites CSS content to handle @import statements and url() functions.
   * @param {string} css - The CSS content to rewrite.
   * @param {string} baseUrl - The base URL of the proxied resource.
   * @returns {string} The rewritten CSS content.
   */
  static rewriteCss(css, baseUrl) {
    css = CssImportRewriter.rewriteImports(css, baseUrl);
    css = CssImportRewriter.rewriteUrls(css, baseUrl);
    return css;
  }
}

module.exports = CssImportRewriter;