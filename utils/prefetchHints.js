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
   * Regular expression to match prefetch hints with as attribute.
   */
  static PREFETCH_AS_REGEX = /<link\s+rel="(?:prefetch|preload)"\s+as="([^"]+)"\s+href="([^"]+)"/gi;

  /**
   * Parses prefetch hints from HTML and caches them.
   * @param {string} html - The HTML content.
   * @param {string} url - The URL of the HTML content.
   * @param {string} [as] - The value of the as attribute.
   */
  static async parsePrefetchHints(html, url, as) {
    const prefetchHints = [];
    let match;

    while ((match = PrefetchHints.PREFETCH_REGEX.exec(html)) !== null) {
      const hintUrl = match[1];
      const absoluteUrl = new URL(hintUrl, url).href;
      prefetchHints.push({ url: absoluteUrl, as: null });
    }

    while ((match = PrefetchHints.PREFETCH_AS_REGEX.exec(html)) !== null) {
      const hintAs = match[1];
      const hintUrl = match[2];
      const absoluteUrl = new URL(hintUrl, url).href;
      if (as && hintAs === as) {
        prefetchHints.push({ url: absoluteUrl, as: hintAs });
      } else if (!as) {
        prefetchHints.push({ url: absoluteUrl, as: hintAs });
      }
    }

    // Cache prefetch hints
    PrefetchHints.prefetchCache.set(url, prefetchHints);

    // Prefetch resources
    await Promise.all(prefetchHints.map((hint) => PrefetchHints.prefetchResource(hint.url, hint.as)));
  }

  /**
   * Prefetches a resource.
   * @param {string} url - The URL of the resource.
   * @param {string} [as] - The value of the as attribute.
   */
  static async prefetchResource(url, as) {
    try {
      const requestInit = {
        method: 'HEAD',
      };

      if (as) {
        requestInit.headers = {
          'Accept': getAcceptHeaderForAs(as),
        };
      }

      const response = await globalThis.fetch(url, requestInit);

      if (response.ok) {
        // Cache response headers
        const cacheKey = new URL(url).href;
        const cacheEntry = {
          headers: response.headers,
          timestamp: Date.now(),
          as,
        };

        // Use Cache API to cache response
        const cache = await globalThis.caches.open('nexus-prefetch-cache');
        await cache.put(cacheKey, new globalThis.Response('', { headers: response.headers }));
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

function getAcceptHeaderForAs(as) {
  switch (as) {
    case 'script':
      return 'text/javascript,application/javascript,application/ecmascript,application/x-ecmascript';
    case 'style':
      return 'text/css';
    case 'image':
      return 'image/*';
    case 'font':
      return 'font/otf,font/ttf,font/woff,font/woff2';
    default:
      return '*/*';
  }
}

export default PrefetchHints;