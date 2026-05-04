class PrefetchHints {
  /**
   * Prefetch hint cache.
   */
  static prefetchCache = new Map();

  /**
   * Threshold for prefetching (in milliseconds).
   */
  static PREFETCH_THRESHOLD = 1000; // 1 second

  /**
   * Regular expression to match prefetch hints.
   */
  static PREFETCH_REGEX = /<link\s+rel="(?:prefetch|preload)"\s+href="([^"]+)"/gi;

  /**
   * Parses prefetch hints from HTML and caches them.
   * @param {string} html - The HTML content.
   * @param {string} url - The URL of the HTML content.
   */
  static async parsePrefetchHints(html, url) {
    const prefetchHints = [];
    let match;

    while ((match = PrefetchHints.PREFETCH_REGEX.exec(html)) !== null) {
      const hintUrl = match[1];
      const absoluteUrl = new URL(hintUrl, url).href;
      prefetchHints.push(absoluteUrl);
    }

    // Cache prefetch hints
    PrefetchHints.prefetchCache.set(url, prefetchHints);

    // Prefetch resources
    await Promise.all(prefetchHints.map((hintUrl) => PrefetchHints.prefetchResource(hintUrl)));
  }

  /**
   * Prefetches a resource.
   * @param {string} url - The URL of the resource.
   */
  static async prefetchResource(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        // Cache response headers
        const cacheKey = new URL(url).href;
        const cacheEntry = {
          headers: response.headers,
          timestamp: Date.now(),
        };
        // Use Cache API to cache response
        const cache = await caches.open('nexus-prefetch-cache');
        await cache.put(cacheKey, new Response('', { headers: response.headers }));
      }
    } catch (error) {
      globalThis.console.error(`Error prefetching ${url}: ${error}`);
    }
  }

  /**
   * Checks if a prefetch hint is valid.
   * @param {string} url - The URL of the prefetch hint.
   * @returns {boolean} True if the prefetch hint is valid, false otherwise.
   */
  static isValidPrefetchHint(url) {
    const cacheEntry = PrefetchHints.prefetchCache.get(url);
    if (!cacheEntry) return false;
    const age = (Date.now() - cacheEntry.timestamp) / 1000;
    return age < PrefetchHints.PREFETCH_THRESHOLD;
  }
}

export default PrefetchHints;