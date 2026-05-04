const { URL } = require('url');

/**
 * Prefetch hint utility class for handling prefetch hints and improving page loading performance.
 */
class PrefetchHintUtils {
  /**
   * Regular expression to match prefetch hints.
   */
  static PREFETCH_HINT_REGEX = /<link\s+rel\s*=\s*["'](prefetch|preload)["']/g;

  /**
   * Cache to store prefetched resources.
   */
  static prefetchCache = {};

  /**
   * Service worker cache instance.
   */
  static swCache;

  /**
   * Initialize the prefetch hint utility.
   * @param {Cache} swCache - The Service Worker cache instance.
   */
  static async init(swCache) {
    PrefetchHintUtils.swCache = swCache;
  }

  /**
   * Handles prefetch hints by caching prefetched resources.
   * @param {string} htmlContent - The HTML content to parse for prefetch hints.
   * @param {string} origin - The origin of the proxied request.
   * @returns {Promise<void>} A promise that resolves when prefetch hints are handled.
   */
  static async handlePrefetchHints(htmlContent, origin) {
    const prefetchHints = htmlContent.match(PrefetchHintUtils.PREFETCH_HINT_REGEX);

    if (prefetchHints) {
      for (const hint of prefetchHints) {
        const urlMatch = hint.match(/href\s*=\s*["'](.*?)["']/);
        if (urlMatch) {
          const prefetchUrl = urlMatch[1];
          const absoluteUrl = new URL(prefetchUrl, origin).href;

          try {
            const cachedResponse = await PrefetchHintUtils.swCache.match(absoluteUrl);
            if (!cachedResponse) {
              const response = await fetch(absoluteUrl);
              const cacheResponse = new Response(response.body, response);
              await PrefetchHintUtils.swCache.put(absoluteUrl, cacheResponse);
            }
          } catch (error) {
            globalThis.console.error(`Error handling prefetch hint: ${error}`);
          }
        }
      }
    }
  }

  /**
   * Checks if a resource is cached.
   * @param {string} url - The URL of the resource to check.
   * @returns {Promise<boolean>} A promise that resolves with a boolean indicating whether the resource is cached.
   */
  static async isCached(url) {
    const cachedResponse = await PrefetchHintUtils.swCache.match(url);
    return cachedResponse !== undefined;
  }
}

module.exports = PrefetchHintUtils;