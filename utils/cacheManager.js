const { caches } = globalThis;
const { URL } = require('url');
const { CACHE_NAME, MAX_CACHE_AGE, PREFETCH_THRESHOLD } = require('./constants');

/**
 * Cache manager utility class for handling Service Worker Cache API operations.
 */
class CacheManager {
  /**
   * Cache instance.
   */
  static cache;

  /**
   * Initialize the cache manager.
   */
  static async init() {
    CacheManager.cache = await caches.open(CACHE_NAME);
  }

  /**
   * Checks if a response is cacheable.
   * @param {Response} response - The response to check.
   * @returns {boolean} True if the response is cacheable, false otherwise.
   */
  static isCacheableResponse(response) {
    return response.url.startsWith('https://') && response.status >= 200 && response.status < 300;
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

    const ttl = response.headers.get('cache-control')?.includes('max-age') ? 
      parseInt(response.headers.get('cache-control').split('max-age=')[1].split(',')[0]) : MAX_CACHE_AGE;
    cacheEntry.headers.set('Cache-Control', `public, max-age=${ttl}`);

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
   * Caches prefetch hints.
   * @param {HTMLLinkElement} linkElement - The link element to cache.
   * @returns {Promise<void>} A promise that resolves when the prefetch hint is cached.
   */
  static async cachePrefetchHint(linkElement) {
    if (linkElement.rel === 'prefetch' || linkElement.rel === 'preload') {
      const href = linkElement.href;
      if (href.startsWith('https://') && !href.includes('localhost')) {
        const prefetchRequest = new Request(href, { method: 'HEAD' });
        const prefetchResponse = await CacheManager.getCachedResponse(prefetchRequest);
        if (!prefetchResponse) {
          const response = await fetch(href, { method: 'HEAD' });
          await CacheManager.cacheResponse(prefetchRequest, response);
        }
      }
    }
  }

  /**
   * Periodically cleans up expired cache entries.
   */
  static async cleanupExpiredEntries() {
    const cacheKeys = await CacheManager.cache.keys();
    for (const cacheKey of cacheKeys) {
      const cachedResponse = await CacheManager.cache.match(cacheKey);
      if (cachedResponse) {
        const cacheControl = cachedResponse.headers.get('cache-control');
        if (cacheControl) {
          const maxAge = parseInt(cacheControl.split('max-age=')[1].split(',')[0]);
          if (maxAge < MAX_CACHE_AGE) {
            await CacheManager.removeCachedResponse(cacheKey);
          }
        }
      }
    }
  }
}

module.exports = CacheManager;