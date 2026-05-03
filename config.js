const CACHE_NAME = 'nexus-cache';
const VERSION = '1.0.0';
const SALT_ROTATION_INTERVAL = 30 * 60 * 1000; // 30 minutes
const ENCODING_MODES = ['xor', 'base64'];
const DEFAULT_ENCODING_MODE = 'xor';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
const PREFETCH_CACHE_AGE = 5 * 60 * 60 * 1000; // 5 hours
const AD_BLOCK_FILTER_LIST_URL = 'https://raw.githubusercontent.com/brave/adblock-lists/master/ublock-origin-default.txt';
const HOSTS_FILE_URL = 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts';
const BOOKMARKS_STORAGE_KEY = 'nexus-bookmarks';
const PROXY_HISTORY_STORAGE_KEY = 'nexus-proxy-history';
const SETTINGS_STORAGE_KEY = 'nexus-settings';

// HTTPS tunnel configuration
const SSL_CERT_FILE = 'path/to/ssl/cert.crt';
const SSL_KEY_FILE = 'path/to/ssl/key.key';
const HTTPS_PORT = 443;
const TLS_PROTOCOLS = ['TLSv1.2', 'TLSv1.3'];

// WebSocket configuration
const WEBSOCKET_TIMEOUT = 30 * 1000; // 30 seconds
const WEBSOCKET_KEEP_ALIVE_INTERVAL = 10 * 1000; // 10 seconds

// Cookie scoping configuration
const COOKIE_SCOPING_ENABLED = true;
const COOKIE_STORAGE_KEY = 'nexus-cookies';

// Header rewriting rules
const HEADER_REWRITE_RULES = {
  'Content-Security-Policy': (value) => value.replace('default-src', 'script-src \'self\''),
  'X-Frame-Options': (value) => value.replace('SAMEORIGIN', '*'),
  'Strict-Transport-Security': (value) => '',
  'X-Content-Type-Options': (value) => value.replace('nosniff', ''),
};

// Integrated HTTPS tunnel and WebSocket settings
const INTEGRATED_HTTPS_TUNNEL = true;
const WEBSOCKET_UPGRADE_PROXYING = true;

// Cache API settings
const CACHE_TTL_HEADERS = ['Cache-Control', 'Expires'];
const CACHE_REVALIDATE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Prefetch hints settings
const PREFETCH_HINTS_ENABLED = true;
const PREFETCH_HINTS_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

module.exports = {
  CACHE_NAME,
  VERSION,
  SALT_ROTATION_INTERVAL,
  ENCODING_MODES,
  DEFAULT_ENCODING_MODE,
  MAX_CACHE_AGE,
  PREFETCH_CACHE_AGE,
  AD_BLOCK_FILTER_LIST_URL,
  HOSTS_FILE_URL,
  BOOKMARKS_STORAGE_KEY,
  PROXY_HISTORY_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SSL_CERT_FILE,
  SSL_KEY_FILE,
  HTTPS_PORT,
  TLS_PROTOCOLS,
  WEBSOCKET_TIMEOUT,
  WEBSOCKET_KEEP_ALIVE_INTERVAL,
  COOKIE_SCOPING_ENABLED,
  COOKIE_STORAGE_KEY,
  HEADER_REWRITE_RULES,
  INTEGRATED_HTTPS_TUNNEL,
  WEBSOCKET_UPGRADE_PROXYING,
  CACHE_TTL_HEADERS,
  CACHE_REVALIDATE_THRESHOLD,
  PREFETCH_HINTS_ENABLED,
  PREFETCH_HINTS_CACHE_AGE,
};