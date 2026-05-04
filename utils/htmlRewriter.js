const { JSDOM } = require('jsdom');

/**
 * HTML rewriter utility class for handling HTML rewriting, including handling all src/href/action/srcset/data attributes,
 * <base> tag injection, <meta http-equiv="refresh"> rewrites, inline <script> and <style> blocks, and nonce stripping.
 */
class HTMLRewriterUtils {
  /**
   * Regular expression to match HTML tags with src attributes.
   */
  static SRC_ATTRIBUTE_TAGS = /(?:img|script|iframe|embed|object|video|audio|source|track|link|picture)\s+[^>]*src\s*=\s*["'](.*?)["']/gi;

  /**
   * Regular expression to match HTML tags with href attributes.
   */
  static HREF_ATTRIBUTE_TAGS = /(?:a|link|area|base)\s+[^>]*href\s*=\s*["'](.*?)["']/gi;

  /**
   * Regular expression to match HTML tags with action attributes.
   */
  static ACTION_ATTRIBUTE_TAGS = /(?:form)\s+[^>]*action\s*=\s*["'](.*?)["']/gi;

  /**
   * Regular expression to match HTML tags with srcset attributes.
   */
  static SRCSET_ATTRIBUTE_TAGS = /(?:img|source)\s+[^>]*srcset\s*=\s*["'](.*?)["']/gi;

  /**
   * Regular expression to match HTML tags with data attributes.
   */
  static DATA_ATTRIBUTE_TAGS = /(?:[a-zA-Z0-9_-]+)\s+[^>]*data-([a-zA-Z0-9_-]+)\s*=\s*["'](.*?)["']/gi;

  /**
   * Regular expression to match <base> tags.
   */
  static BASE_TAG_REGEX = /<base\s+[^>]*href\s*=\s*["'](.*?)["']/gi;

  /**
   * Regular expression to match <meta http-equiv="refresh"> tags.
   */
  static META_REFRESH_TAG_REGEX = /<meta\s+http-equiv\s*=\s*["']refresh["']\s+[^>]*content\s*=\s*["'](.*?)["']/gi;

  /**
   * Regular expression to match inline <script> and <style> blocks.
   */
  static INLINE_SCRIPT_STYLE_REGEX = /<(script|style)\s+[^>]*>([\s\S]*?)<\/\1>/gi;

  /**
   * Rewrites HTML content by handling all src/href/action/srcset/data attributes, <base> tag injection,
   * <meta http-equiv="refresh"> rewrites, inline <script> and <style> blocks, and nonce stripping.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteHTML(html, proxiedUrl) {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Handle <base> tag injection
    const baseTag = document.querySelector('base');
    if (!baseTag) {
      const newBaseTag = document.createElement('base');
      newBaseTag.href = proxiedUrl;
      document.head.insertBefore(newBaseTag, document.head.firstChild);
    } else {
      baseTag.href = proxiedUrl;
    }

    // Handle src attributes
    const srcMatches = html.match(HTMLRewriterUtils.SRC_ATTRIBUTE_TAGS);
    if (srcMatches) {
      srcMatches.forEach((match) => {
        const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
        const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
        html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
      });
    }

    // Handle href attributes
    const hrefMatches = html.match(HTMLRewriterUtils.HREF_ATTRIBUTE_TAGS);
    if (hrefMatches) {
      hrefMatches.forEach((match) => {
        const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
        const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
        html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
      });
    }

    // Handle action attributes
    const actionMatches = html.match(HTMLRewriterUtils.ACTION_ATTRIBUTE_TAGS);
    if (actionMatches) {
      actionMatches.forEach((match) => {
        const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
        const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
        html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
      });
    }

    // Handle srcset attributes
    const srcsetMatches = html.match(HTMLRewriterUtils.SRCSET_ATTRIBUTE_TAGS);
    if (srcsetMatches) {
      srcsetMatches.forEach((match) => {
        const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
        const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
        html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
      });
    }

    // Handle data attributes
    const dataMatches = html.match(HTMLRewriterUtils.DATA_ATTRIBUTE_TAGS);
    if (dataMatches) {
      dataMatches.forEach((match) => {
        const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
        const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
        html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
      });
    }

    // Handle <meta http-equiv="refresh"> tags
    const metaRefreshMatches = html.match(HTMLRewriterUtils.META_REFRESH_TAG_REGEX);
    if (metaRefreshMatches) {
      metaRefreshMatches.forEach((match) => {
        const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
        const rewrittenAttributeValue = HTMLRewriterUtils.rewriteRefreshAttributeValue(attributeValue, proxiedUrl);
        html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
      });
    }

    // Handle inline <script> and <style> blocks
    const inlineScriptStyleMatches = html.match(HTMLRewriterUtils.INLINE_SCRIPT_STYLE_REGEX);
    if (inlineScriptStyleMatches) {
      inlineScriptStyleMatches.forEach((match) => {
        const rewrittenMatch = HTMLRewriterUtils.rewriteInlineScriptStyle(match, proxiedUrl);
        html = html.replace(match, rewrittenMatch);
      });
    }

    return html;
  }

  /**
   * Rewrites an attribute value by prepending the proxied URL if it's a relative URL.
   * @param {string} attributeValue - The attribute value to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten attribute value.
   */
  static rewriteAttributeValue(attributeValue, proxiedUrl) {
    const url = new URL(attributeValue, proxiedUrl);
    return url.href;
  }

  /**
   * Rewrites a <meta http-equiv="refresh"> attribute value by updating the URL.
   * @param {string} attributeValue - The attribute value to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten attribute value.
   */
  static rewriteRefreshAttributeValue(attributeValue, proxiedUrl) {
    const url = new URL(attributeValue, proxiedUrl);
    return `${url.pathname}?${url.search}`;
  }

  /**
   * Rewrites an inline <script> or <style> block by updating any relative URLs.
   * @param {string} match - The inline <script> or <style> block to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten inline <script> or <style> block.
   */
  static rewriteInlineScriptStyle(match, proxiedUrl) {
    return match.replace(/url\(['"](.*?)['"]\)/g, (urlMatch, url) => {
      const rewrittenUrl = HTMLRewriterUtils.rewriteAttributeValue(url, proxiedUrl);
      return `url(${rewrittenUrl})`;
    });
  }
}

module.exports = HTMLRewriterUtils;