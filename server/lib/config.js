const config = {
  // Server configuration
  server: {
    port: process.env.NEXUS_SERVER_PORT || 8080,
    host: process.env.NEXUS_SERVER_HOST || 'localhost',
    https: {
      key: process.env.NEXUS_HTTPS_KEY || 'server.key',
      cert: process.env.NEXUS_HTTPS_CERT || 'server.crt',
      allowHTTP2: true,
      tlsVersions: ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'],
      http2: {
        enabled: true,
        push: true,
      },
    },
    auth: {
      secret: process.env.NEXUS_AUTH_SECRET || 'nexus-auth-secret',
      tokenExpiration: 60 * 60 * 24 * 7, // 1 week
      cookieName: 'nexus-auth-token',
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      },
      strategies: {
        local: {
          username: 'admin',
          password: 'password',
        },
      },
    },
    cors: {
      enabled: true,
      origin: process.env.NEXUS_CORS_ORIGIN || '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 200,
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true,
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
    workbox: {
      enabled: true,
      globPatterns: ['**/*.{js,css,html}'],
      globDirectory: './',
    },
  },
  // Encoding configuration
  encoding: {
    salt: process.env.NEXUS_ENCODING_SALT || 'nexus-salt',
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
    search: {
      providers: [
        {
          name: 'Google',
          url: 'https://www.google.com/search?q=',
        },
        {
          name: 'Bing',
          url: 'https://www.bing.com/search?q=',
        },
      ],
      defaultProvider: 'Google',
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
    helmet: {
      enabled: true,
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'"],
        },
      },
    },
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
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
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: 'json',
    output: 'console',
    transports: [
      {
        type: 'console',
      },
      {
        type: 'file',
        filename: 'logs/error.log',
        level: 'error',
      },
      {
        type: 'file',
        filename: 'logs/combined.log',
      },
    ],
  },
};

module.exports = config;