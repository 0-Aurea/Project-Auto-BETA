const { caches } = globalThis;
const { URL } = require('url');

/**
 * Cache manager utility class for handling Service Worker Cache API operations.
 */
class CacheManager {
  /**
   * Cache name for storing proxied responses.
   */
  static CACHE_NAME = 'nexus-cache';

  /**
   * Regular expression to match cacheable response statuses.
   */
  static CACHEABLE_STATUS_REGEX = /^https?:\/\/.*$/;

  /**
   * TTL (time to live) for cache entries in seconds.
   */
  static TTL = 3600; // 1 hour

  /**
   * Cache instance.
   */
  static cache;

  /**
   * Initialize the cache manager.
   */
  static async init() {
    CacheManager.cache = await caches.open(CacheManager.CACHE_NAME);
  }

  /**
   * Checks if a response is cacheable.
   * @param {Response} response - The response to check.
   * @returns {boolean} True if the response is cacheable, false otherwise.
   */
  static isCacheableResponse(response) {
    return CacheManager.CACHEABLE_STATUS_REGEX.test(response.url) && response.status >= 200 && response.status < 300;
  }

  /**
   * Caches a response with a TTL header and optional re-compression.
   * @param {Request} request - The request associated with the response.
   * @param {Response} response - The response to cache.
   * @param {boolean} reCompress - Whether to re-compress the response body.
   * @returns {Promise<void>} A promise that resolves when the response is cached.
   */
  static async cacheResponse(request, response, reCompress = false) {
    if (!CacheManager.isCacheableResponse(response)) return;

    let cacheEntry;
    if (reCompress) {
      const contentEncoding = response.headers.get('content-encoding');
      if (contentEncoding === 'br') {
        const decompressedBody = await response.text();
        cacheEntry = new Response(decompressedBody, {
          ...response,
          headers: {
            ...response.headers,
            'content-encoding': 'gzip',
          },
        });
      } else if (contentEncoding === 'gzip') {
        const decompressedBody = await response.text();
        cacheEntry = new Response(decompressedBody, {
          ...response,
          headers: {
            ...response.headers,
            'content-encoding': 'br',
          },
        });
      } else {
        cacheEntry = new Response(response.body, response);
      }
    } else {
      cacheEntry = new Response(response.body, response);
    }

    cacheEntry.headers.set('Cache-Control', `public, max-age=${CacheManager.TTL}`);

    await CacheManager.cache.put(request, cacheEntry);
  }

  /**
   * Retrieves a cached response.
   * @param {Request} request - The request to retrieve the cached response for.
   * @returns {Promise<Response|null>} A promise that resolves with the cached response or null if not found.
   */
  static async getCachedResponse(request) {
    const cachedResponse = await CacheManager.cache.match(request);
    return cachedResponse;
  }

  /**
   * Removes a cached response.
   * @param {Request} request - The request to remove the cached response for.
   * @returns {Promise<void>} A promise that resolves when the cached response is removed.
   */
  static async removeCachedResponse(request) {
    await CacheManager.cache.delete(request);
  }

  /**
   * Clears all cached responses.
   * @returns {Promise<void>} A promise that resolves when the cache is cleared.
   */
  static async clearCache() {
    await CacheManager.cache.keys().then(async (keys) => {
      for (const key of keys) {
        await CacheManager.cache.delete(key);
      }
    });
  }

  /**
   * Prefetches a response and caches it.
   * @param {Request} request - The request to prefetch and cache.
   * @returns {Promise<void>} A promise that resolves when the response is prefetched and cached.
   */
  static async prefetchResponse(request) {
    try {
      const response = await globalThis.fetch(request);
      await CacheManager.cacheResponse(request, response, true);
    } catch (error) {
      globalThis.console.error(`Error prefetching response: ${error}`);
    }
  }

  /**
   * Handles prefetch hints by parsing <link rel="prefetch/preload"> tags.
   * @param {HTMLDocument} document - The HTML document to parse.
   * @returns {Promise<void>} A promise that resolves when prefetch hints are handled.
   */
  static async handlePrefetchHints(document) {
    const prefetchLinks = document.querySelectorAll('link[rel="prefetch"], link[rel="preload"]');
    for (const link of prefetchLinks) {
      const href = link.href;
      if (href) {
        const request = new Request(href, {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        });
        await CacheManager.prefetchResponse(request);
      }
    }
  }
}

export default CacheManager;