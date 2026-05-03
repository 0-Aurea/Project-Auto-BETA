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
    }

    // Handle src attributes
    HTMLRewriterUtils.SRC_ATTRIBUTE_TAGS.forEach((tag) => {
      const matches = html.match(tag);
      if (matches) {
        matches.forEach((match) => {
          const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
          const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
          html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
        });
      }
    });

    // Handle href attributes
    HTMLRewriterUtils.HREF_ATTRIBUTE_TAGS.forEach((tag) => {
      const matches = html.match(tag);
      if (matches) {
        matches.forEach((match) => {
          const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
          const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
          html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
        });
      }
    });

    // Handle action attributes
    HTMLRewriterUtils.ACTION_ATTRIBUTE_TAGS.forEach((tag) => {
      const matches = html.match(tag);
      if (matches) {
        matches.forEach((match) => {
          const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
          const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
          html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
        });
      }
    });

    // Handle srcset attributes
    HTMLRewriterUtils.SRCSET_ATTRIBUTE_TAGS.forEach((tag) => {
      const matches = html.match(tag);
      if (matches) {
        matches.forEach((match) => {
          const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
          const rewrittenAttributeValue = HTMLRewriterUtils.rewriteSrcsetAttributeValue(attributeValue, proxiedUrl);
          html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
        });
      }
    });

    // Handle data attributes
    HTMLRewriterUtils.DATA_ATTRIBUTE_TAGS.forEach((tag) => {
      const matches = html.match(tag);
      if (matches) {
        matches.forEach((match) => {
          const attributeValue = match.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
          const rewrittenAttributeValue = HTMLRewriterUtils.rewriteAttributeValue(attributeValue, proxiedUrl);
          html = html.replace(match, match.replace(attributeValue, rewrittenAttributeValue));
        });
      }
    });

    // Handle <meta http-equiv="refresh"> tags
    const metaRefreshTags = html.match(HTMLRewriterUtils.META_REFRESH_TAG_REGEX);
    if (metaRefreshTags) {
      metaRefreshTags.forEach((tag) => {
        const content = tag.replace(/[^=]*=\s*["'](.*?)["']/, '$1');
        const rewrittenContent = HTMLRewriterUtils.rewriteMetaRefreshContent(content, proxiedUrl);
        html = html.replace(tag, tag.replace(content, rewrittenContent));
      });
    }

    // Handle inline <script> and <style> blocks
    const inlineScriptStyleBlocks = html.match(HTMLRewriterUtils.INLINE_SCRIPT_STYLE_REGEX);
    if (inlineScriptStyleBlocks) {
      inlineScriptStyleBlocks.forEach((block) => {
        const rewrittenBlock = HTMLRewriterUtils.rewriteInlineScriptStyleBlock(block, proxiedUrl);
        html = html.replace(block, rewrittenBlock);
      });
    }

    return dom.serialize();
  }

  /**
   * Rewrites an attribute value by prepending the proxied URL.
   * @param {string} attributeValue - The attribute value to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten attribute value.
   */
  static rewriteAttributeValue(attributeValue, proxiedUrl) {
    if (attributeValue.startsWith('http')) {
      return attributeValue;
    }
    return `${proxiedUrl}/${attributeValue}`;
  }

  /**
   * Rewrites a srcset attribute value by prepending the proxied URL.
   * @param {string} srcsetAttributeValue - The srcset attribute value to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten srcset attribute value.
   */
  static rewriteSrcsetAttributeValue(srcsetAttributeValue, proxiedUrl) {
    return srcsetAttributeValue.split(',').map((value) => {
      const trimmedValue = value.trim();
      const url = trimmedValue.replace(/[^ ]*/, '');
      if (url.startsWith('http')) {
        return trimmedValue;
      }
      return `${proxiedUrl}/${url} ${trimmedValue.replace(/[^ ]*/, '')}`;
    }).join(', ');
  }

  /**
   * Rewrites the content of a <meta http-equiv="refresh"> tag.
   * @param {string} content - The content to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten content.
   */
  static rewriteMetaRefreshContent(content, proxiedUrl) {
    if (content.startsWith('http')) {
      return content;
    }
    return `${proxiedUrl}/${content}`;
  }

  /**
   * Rewrites an inline <script> or <style> block.
   * @param {string} block - The block to rewrite.
   * @param {string} proxiedUrl - The URL of the proxied request.
   * @returns {string} The rewritten block.
   */
  static rewriteInlineScriptStyleBlock(block, proxiedUrl) {
    return block.replace(/url\(['"](.*?)['"]\)/g, (match, url) => {
      if (url.startsWith('http')) {
        return match;
      }
      return `url('${proxiedUrl}/${url}')`;
    });
  }
}

module.exports = HTMLRewriterUtils;