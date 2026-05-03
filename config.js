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

const SSL_CERT_FILE = 'path/to/ssl/cert.crt';
const SSL_KEY_FILE = 'path/to/ssl/key.key';
const HTTPS_PORT = 443;
const TLS_PROTOCOLS = ['TLSv1.2', 'TLSv1.3'];

const WEBSOCKET_TIMEOUT = 30 * 1000; // 30 seconds
const WEBSOCKET_KEEP_ALIVE_INTERVAL = 10 * 1000; // 10 seconds
const WEBSOCKET_PING_INTERVAL = 5 * 1000; // 5 seconds
const WEBSOCKET_PONG_TIMEOUT = 5 * 1000; // 5 seconds

const COOKIE_SCOPING_ENABLED = true;
const COOKIE_STORAGE_KEY = 'nexus-cookies';

const HEADER_REWRITE_RULES = {
  'Content-Security-Policy': (value) => value.replace('default-src', 'script-src \'self\''),
  'X-Frame-Options': (value) => value.replace('SAMEORIGIN', '*'),
  'Strict-Transport-Security': (value) => '',
  'X-Content-Type-Options': (value) => value.replace('nosniff', ''),
};

const INTEGRATED_HTTPS_TUNNEL = true;
const WEBSOCKET_UPGRADE_PROXYING = true;

const CACHE_TTL_HEADERS = ['Cache-Control', 'Expires'];
const CACHE_REVALIDATE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const CACHE_SIZE_LIMIT = 100 * 1024 * 1024; // 100MB

const PREFETCH_HINTS_ENABLED = true;
const PREFETCH_HINTS_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

const COMPRESSION_ENABLED = true;
const BROTLI_COMPRESSION_THRESHOLD = 1024; // bytes
const GZIP_COMPRESSION_THRESHOLD = 1024; // bytes
const COMPRESSION_MIN_SIZE = 100; // bytes
const COMPRESSION_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const CONNECTION_TIMEOUT = 10 * 1000; // 10 seconds
const SOCKET_TIMEOUT = 30 * 1000; // 30 seconds

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
  WEBSOCKET_PING_INTERVAL,
  WEBSOCKET_PONG_TIMEOUT,
  COOKIE_SCOPING_ENABLED,
  COOKIE_STORAGE_KEY,
  HEADER_REWRITE_RULES,
  INTEGRATED_HTTPS_TUNNEL,
  WEBSOCKET_UPGRADE_PROXYING,
  CACHE_TTL_HEADERS,
  CACHE_REVALIDATE_THRESHOLD,
  CACHE_SIZE_LIMIT,
  PREFETCH_HINTS_ENABLED,
  PREFETCH_HINTS_CACHE_AGE,
  COMPRESSION_ENABLED,
  BROTLI_COMPRESSION_THRESHOLD,
  GZIP_COMPRESSION_THRESHOLD,
  COMPRESSION_MIN_SIZE,
  COMPRESSION_MAX_SIZE,
  CONNECTION_TIMEOUT,
  SOCKET_TIMEOUT,
};