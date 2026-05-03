const config = {
  // Server configuration
  port: 8080,
  host: 'localhost',
  https: {
    key: 'server.key',
    cert: 'server.crt',
    allowHTTP2: true,
  },
  // Service Worker configuration
  swCacheName: 'nexus-cache',
  swCacheTTL: 60 * 60 * 24 * 7, // 1 week
  // Encoding configuration
  encoding: {
    salt: 'nexus-salt',
    algorithm: 'xor',
    base64: true,
  },
  // Frontend configuration
  frontend: {
    darkMode: true,
    tabBar: true,
    proxyHistory: true,
    settings: {
      encodingMode: true,
      cacheToggle: true,
      adBlockToggle: true,
    },
    adBlock: {
      filterList: 'hosts-based-filter-list.txt',
    },
    bookmarks: true,
  },
  // Security configuration
  security: {
    cookieScoping: true,
    webRTC: {
      iceCandidateScrubbing: true,
    },
  },
  // Performance configuration
  performance: {
    brotli: true,
    gzip: true,
    prefetchHints: true,
  },
};

module.exports = config;