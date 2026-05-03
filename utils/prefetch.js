const { URL } = require('url');
const { CacheUtils } = require('./cache');

/**
 * Prefetch utility class for handling prefetch hints and cache ahead.
 */
class PrefetchUtils {
  /**
   * Regular expression to match prefetch links.
   */
  static PREFETCH_REGEX = /<link\s+rel\s*=\s*["'](prefetch|preload)["'].*?>/gi;

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
      const response = await fetch(url);
      if (response.ok) {
        await CacheUtils.cache.put(url, response.clone());
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
    const prefetchLinks = html.match(PrefetchUtils.PREFETCH_REGEX);
    if (prefetchLinks) {
      for (const link of prefetchLinks) {
        const url = new URL(link, baseUrl).href;
        await PrefetchUtils.prefetch(url);
      }
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
}

module.exports = { PrefetchUtils };