const { URL } = require('url');

/**
 * Prefetch hints utility class for parsing <link rel="prefetch/preload"> and caching ahead.
 */
class PrefetchHints {
  /**
   * Regular expression to match prefetch/preload links.
   */
  static PREFETCH_LINK_REGEX = /<link\s+rel\s*=\s*["'](prefetch|preload)["']\s+href\s*=\s*["'](.*?)["']/gi;

  /**
   * Cache for prefetch hints.
   */
  static prefetchCache = {};

  /**
   * Service worker cache instance.
   */
  static swCache;

  /**
   * Initializes the prefetch hints utility with the service worker cache instance.
   * @param {Cache} swCache - The service worker cache instance.
   */
  static init(swCache) {
    PrefetchHints.swCache = swCache;
  }

  /**
   * Parses HTML for prefetch/preload links and caches ahead.
   * @param {string} html - The HTML to parse.
   * @param {string} url - The URL of the HTML document.
   */
  static parsePrefetchHints(html, url) {
    const prefetchLinks = html.match(PrefetchHints.PREFETCH_LINK_REGEX);

    if (prefetchLinks) {
      prefetchLinks.forEach((link) => {
        const match = link.match(PrefetchHints.PREFETCH_LINK_REGEX);
        if (match) {
          const rel = match[1];
          const href = match[2];

          if (rel && href) {
            const proxiedUrl = PrefetchHints.getProxiedUrl(href, url);
            PrefetchHints.prefetchCache[proxiedUrl] = true;
            PrefetchHints.cacheAhead(proxiedUrl);
          }
        }
      });
    }
  }

  /**
   * Gets the proxied URL for a given URL.
   * @param {string} url - The URL to proxy.
   * @param {string} referrer - The referrer URL.
   * @returns {string} The proxied URL.
   */
  static getProxiedUrl(url, referrer) {
    // Implement proxy URL logic here
    // For demonstration purposes, assume a simple proxy URL
    return `/proxy/${url}`;
  }

  /**
   * Caches ahead for a given URL.
   * @param {string} url - The URL to cache ahead.
   */
  static async cacheAhead(url) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const cache = await PrefetchHints.swCache.open('prefetch-cache');
        await cache.put(url, response.clone());
      }
    } catch (error) {
      globalThis.console.error(`Error caching ahead: ${error}`);
    }
  }

  /**
   * Checks if a URL is cached.
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is cached, false otherwise.
   */
  static async isCached(url) {
    try {
      const cache = await PrefetchHints.swCache.open('prefetch-cache');
      const cachedResponse = await cache.match(url);
      return cachedResponse !== undefined;
    } catch (error) {
      globalThis.console.error(`Error checking cache: ${error}`);
      return false;
    }
  }
}

export default PrefetchHints;