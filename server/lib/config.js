const config = {
  // Server configuration
  server: {
    port: 8080,
    host: 'localhost',
    https: {
      key: 'server.key',
      cert: 'server.crt',
      allowHTTP2: true,
      tlsv1: true,
      tlsv1_1: true,
      tlsv1_2: true,
      tlsv1_3: true,
    },
    cors: {
      enabled: true,
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 200,
    },
  },
  // Service Worker configuration
  sw: {
    cacheName: 'nexus-cache',
    cacheTTL: 60 * 60 * 24 * 7, // 1 week
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    cacheStrategy: 'stale-while-revalidate',
    cacheControl: {
      enabled: true,
      cacheControlHeader: 'public, max-age=31536000',
    },
    prefetchHints: {
      enabled: true,
      prefetchThreshold: 0.5,
      prefetchAhead: 10,
    },
  },
  // Encoding configuration
  encoding: {
    salt: 'nexus-salt',
    algorithm: 'xor',
    base64: true,
    rotationInterval: 60 * 60 * 24, // 1 day
  },
  // Frontend configuration
  frontend: {
    ui: {
      darkMode: true,
      theme: 'material',
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
    },
    features: {
      tabBar: true,
      proxyHistory: true,
      settings: {
        encodingMode: true,
        cacheToggle: true,
        adBlockToggle: true,
      },
      adBlock: {
        filterList: 'hosts-based-filter-list.txt',
        enabled: true,
      },
      bookmarks: true,
      aboutBlankCloaking: true,
    },
  },
  // Security configuration
  security: {
    cookieScoping: true,
    webRTC: {
      iceCandidateScrubbing: true,
      ipLeakPrevention: true,
    },
    csp: {
      enabled: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
      },
    },
  },
  // Performance configuration
  performance: {
    compression: {
      brotli: true,
      gzip: true,
    },
    caching: {
      enabled: true,
      cacheControl: 'public, max-age=31536000',
    },
  },
  // Logging configuration
  logging: {
    level: 'info',
    format: 'json',
    output: 'console',
  },
};

module.exports = config;