const { URL } = require('url');
const { CacheUtils } = require('./cache');

/**
 * Prefetch hint utility class for parsing <link rel="prefetch/preload"> and caching ahead.
 */
class PrefetchHintUtils {
  /**
   * Regular expression to match prefetch/preload links.
   */
  static PREFETCH_REGEX = /<link\s+rel\s*=\s*["'](prefetch|preload)["'](.*?)>/gi;

  /**
   * Parse prefetch/preload links from HTML and cache ahead.
   * @param {string} html - The HTML to parse.
   * @param {string} baseUrl - The base URL to resolve relative URLs.
   * @returns {Promise<void>}
   */
  static async parsePrefetchHints(html, baseUrl) {
    const prefetchLinks = html.matchAll(PrefetchHintUtils.PREFETCH_REGEX);

    for (const link of prefetchLinks) {
      const url = new URL(link[2].replace(/href\s*=\s*["'](.*?)["']/, '$1'), baseUrl).href;

      if (url) {
        try {
          await CacheUtils.cacheResponse(url);
        } catch (error) {
          globalThis.console.error(`Error caching prefetch link: ${error}`);
        }
      }
    }
  }

  /**
   * Extract prefetch/preload URLs from a list of HTML elements.
   * @param {HTMLCollection} elements - The HTML elements to extract from.
   * @param {string} baseUrl - The base URL to resolve relative URLs.
   * @returns {string[]} The list of prefetch/preload URLs.
   */
  static extractPrefetchUrls(elements, baseUrl) {
    const prefetchUrls = [];

    for (const element of elements) {
      if (element.rel === 'prefetch' || element.rel === 'preload') {
        const url = new URL(element.href, baseUrl).href;
        prefetchUrls.push(url);
      }
    }

    return prefetchUrls;
  }

  /**
   * Handle prefetch/preload links in a Service Worker.
   * @param {object} event - The fetch event.
   * @returns {Promise<void>}
   */
  static async handlePrefetchHints(event) {
    const { request } = event;

    if (request.method === 'GET' && request.headers.get('purpose') === 'prefetch') {
      try {
        await CacheUtils.cacheResponse(request.url);
      } catch (error) {
        globalThis.console.error(`Error caching prefetch request: ${error}`);
      }
    }
  }
}

module.exports = { PrefetchHintUtils };