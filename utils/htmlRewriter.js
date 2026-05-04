'use strict';

/**
 * HTML rewriter utility class for handling dynamic content rewriting.
 */
class HTMLRewriter {
  /**
   * Regular expression to match src attributes in HTML tags.
   */
  static SRC_ATTRIBUTE_REGEX = /\bsrc\s*=\s*[\'\"](.*?)[\'\"]/g;

  /**
   * Regular expression to match href attributes in HTML tags.
   */
  static HREF_ATTRIBUTE_REGEX = /\bhref\s*=\s*[\'\"](.*?)[\'\"]/g;

  /**
   * Regular expression to match action attributes in HTML tags.
   */
  static ACTION_ATTRIBUTE_REGEX = /\baction\s*=\s*[\'\"](.*?)[\'\"]/g;

  /**
   * Regular expression to match srcset attributes in HTML tags.
   */
  static SRCSET_ATTRIBUTE_REGEX = /\bsrcset\s*=\s*[\'\"](.*?)[\'\"]/g;

  /**
   * Regular expression to match data attributes in HTML tags.
   */
  static DATA_ATTRIBUTE_REGEX = /\bdata-[\w-]+\s*=\s*[\'\"](.*?)[\'\"]/g;

  /**
   * Regular expression to match <base> tags.
   */
  static BASE_TAG_REGEX = /<base\s+[^>]*>/g;

  /**
   * Regular expression to match inline <script> blocks.
   */
  static SCRIPT_BLOCK_REGEX = /<script[^>]*>([\s\S]*?)<\/script>/g;

  /**
   * Regular expression to match inline <style> blocks.
   */
  static STYLE_BLOCK_REGEX = /<style[^>]*>([\s\S]*?)<\/style>/g;

  /**
   * Rewrites HTML content to handle dynamic content rewriting.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteHTML(html, proxiedUrl) {
    // Handle <base> tag injection
    html = HTMLRewriter.injectBaseTag(html, proxiedUrl);

    // Handle src attributes in HTML tags
    html = HTMLRewriter.rewriteSrcAttributes(html, proxiedUrl);

    // Handle href attributes in HTML tags
    html = HTMLRewriter.rewriteHrefAttributes(html, proxiedUrl);

    // Handle action attributes in HTML tags
    html = HTMLRewriter.rewriteActionAttributes(html, proxiedUrl);

    // Handle srcset attributes in HTML tags
    html = HTMLRewriter.rewriteSrcsetAttributes(html, proxiedUrl);

    // Handle data attributes in HTML tags
    html = HTMLRewriter.rewriteDataAttributes(html, proxiedUrl);

    // Handle inline <script> blocks
    html = HTMLRewriter.rewriteScriptBlocks(html, proxiedUrl);

    // Handle inline <style> blocks
    html = HTMLRewriter.rewriteStyleBlocks(html, proxiedUrl);

    return html;
  }

  /**
   * Injects a <base> tag into the HTML content.
   * @param {string} html - The HTML content to inject into.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The HTML content with the injected <base> tag.
   */
  static injectBaseTag(html, proxiedUrl) {
    return html.replace(/<head>/, `<head><base href="${proxiedUrl}">`);
  }

  /**
   * Rewrites src attributes in HTML tags.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteSrcAttributes(html, proxiedUrl) {
    return html.replace(HTMLRewriter.SRC_ATTRIBUTE_REGEX, (match, src) => {
      return `src="${proxiedUrl}/${src}"`;
    });
  }

  /**
   * Rewrites href attributes in HTML tags.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteHrefAttributes(html, proxiedUrl) {
    return html.replace(HTMLRewriter.HREF_ATTRIBUTE_REGEX, (match, href) => {
      return `href="${proxiedUrl}/${href}"`;
    });
  }

  /**
   * Rewrites action attributes in HTML tags.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteActionAttributes(html, proxiedUrl) {
    return html.replace(HTMLRewriter.ACTION_ATTRIBUTE_REGEX, (match, action) => {
      return `action="${proxiedUrl}/${action}"`;
    });
  }

  /**
   * Rewrites srcset attributes in HTML tags.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteSrcsetAttributes(html, proxiedUrl) {
    return html.replace(HTMLRewriter.SRCSET_ATTRIBUTE_REGEX, (match, srcset) => {
      return `srcset="${srcset.split(',').map((src) => `${proxiedUrl}/${src.trim()}`).join(',')}"`;
    });
  }

  /**
   * Rewrites data attributes in HTML tags.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteDataAttributes(html, proxiedUrl) {
    return html.replace(HTMLRewriter.DATA_ATTRIBUTE_REGEX, (match, data) => {
      return `${match}=${proxiedUrl}/${data}`;
    });
  }

  /**
   * Rewrites inline <script> blocks.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteScriptBlocks(html, proxiedUrl) {
    return html.replace(HTMLRewriter.SCRIPT_BLOCK_REGEX, (match, script) => {
      return `<script>${script.replace(/https?:\/\/[^/]+/g, proxiedUrl)}</script>`;
    });
  }

  /**
   * Rewrites inline <style> blocks.
   * @param {string} html - The HTML content to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten HTML content.
   */
  static rewriteStyleBlocks(html, proxiedUrl) {
    return html.replace(HTMLRewriter.STYLE_BLOCK_REGEX, (match, style) => {
      return `<style>${style.replace(/https?:\/\/[^/]+/g, proxiedUrl)}</style>`;
    });
  }
}

module.exports = HTMLRewriter;