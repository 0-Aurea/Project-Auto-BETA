const { URL } = require('url');
const { CacheUtils } = require('./cache');
const { HTMLRewriterUtils } = require('./htmlRewriter');

/**
 * Prefetch utility class for handling prefetch hints and cache ahead.
 */
class PrefetchUtils {
  /**
   * Regular expression to match prefetch links.
   */
  static PREFETCH_REGEX = /<link\s+rel\s*=\s*["'](prefetch|preload)["'][^>]*href\s*=\s*["'](.*?)["']/gi;

  /**
   * Cache instance.
   */
  static cache = CacheUtils.cache;

  /**
   * Prefetches a URL and caches the response.
   * @param {string} url - The URL to prefetch.
   * @returns {Promise<void>}
   */
  static async prefetch(url) {
    try {
      const response = await globalThis.fetch(url);
      if (response.ok) {
        await PrefetchUtils.cache.put(url, response.clone());
      }
    } catch (error) {
      globalThis.console.error(`Error prefetching ${url}:`, error);
    }
  }

  /**
   * Extracts prefetch links from an HTML string and prefetches them.
   * @param {string} html - The HTML string to extract prefetch links from.
   * @param {string} baseUrl - The base URL to resolve relative prefetch links against.
   * @returns {Promise<void>}
   */
  static async extractAndPrefetch(html, baseUrl) {
    let match;
    while ((match = PrefetchUtils.PREFETCH_REGEX.exec(html)) !== null) {
      const url = new URL(match[2], baseUrl).href;
      await PrefetchUtils.prefetch(url);
    }
  }

  /**
   * Handles prefetch hints in a HTML document.
   * @param {string} html - The HTML document to handle prefetch hints in.
   * @param {string} baseUrl - The base URL to resolve relative prefetch links against.
   * @returns {Promise<string>} The modified HTML document with prefetch hints handled.
   */
  static async handlePrefetchHints(html, baseUrl) {
    await PrefetchUtils.extractAndPrefetch(html, baseUrl);
    return html;
  }

  /**
   * Parses HTML and extracts prefetch links, handling relative URLs and caching responses.
   * @param {string} html - The HTML string to parse.
   * @param {string} baseUrl - The base URL to resolve relative prefetch links against.
   * @returns {Promise<void>}
   */
  static async parseAndPrefetch(html, baseUrl) {
    const doc = new globalThis.DOMParser().parseFromString(html, 'text/html');
    const prefetchLinks = doc.querySelectorAll('link[rel="prefetch"], link[rel="preload"]');
    for (const link of prefetchLinks) {
      const url = new URL(link.href, baseUrl).href;
      await PrefetchUtils.prefetch(url);
    }
  }

  /**
   * Rewrites HTML to remove prefetch hints and handle caching.
   * @param {string} html - The HTML string to rewrite.
   * @param {string} baseUrl - The base URL to resolve relative prefetch links against.
   * @returns {Promise<string>} The rewritten HTML string with prefetch hints removed.
   */
  static async rewriteAndCache(html, baseUrl) {
    const doc = new globalThis.DOMParser().parseFromString(html, 'text/html');
    const prefetchLinks = doc.querySelectorAll('link[rel="prefetch"], link[rel="preload"]');
    for (const link of prefetchLinks) {
      link.remove();
    }
    const rewrittenHtml = doc.documentElement.outerHTML;
    await PrefetchUtils.parseAndPrefetch(rewrittenHtml, baseUrl);
    return rewrittenHtml;
  }
}

module.exports = { PrefetchUtils };