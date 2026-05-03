const CACHE_NAME = 'nexus-cache';
const VERSION = '1.0.0';
const SALT_ROTATION_INTERVAL = 30 * 60 * 1000; // 30 minutes

const ENCODING_MODES = ['xor', 'base64'];
const DEFAULT_ENCODING_MODE = 'xor';

const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
const PREFETCH_CACHE_AGE = 5 * 60 * 60 * 1000; // 5 hours

const AD_BLOCK_FILTER_LIST_URL = process.env.AD_BLOCK_FILTER_LIST_URL || 'https://raw.githubusercontent.com/brave/adblock-lists/master/ublock-origin-default.txt';
const HOSTS_FILE_URL = process.env.HOSTS_FILE_URL || 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts';

const BOOKMARKS_STORAGE_KEY = 'nexus-bookmarks';
const PROXY_HISTORY_STORAGE_KEY = 'nexus-proxy-history';
const SETTINGS_STORAGE_KEY = 'nexus-settings';

const SSL_CERT_FILE = process.env.SSL_CERT_FILE || 'path/to/ssl/cert.crt';
const SSL_KEY_FILE = process.env.SSL_KEY_FILE || 'path/to/ssl/key.key';
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
const TLS_PROTOCOLS = process.env.TLS_PROTOCOLS ? process.env.TLS_PROTOCOLS.split(',') : ['TLSv1.2', 'TLSv1.3'];

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

const TAB_BAR_ENABLED = true;
const TAB_BAR_WIDTH = 250;
const TAB_BAR_HEIGHT = 40;

const SETTINGS_PANEL_ENABLED = true;
const SETTINGS_PANEL_WIDTH = 300;
const SETTINGS_PANEL_HEIGHT = 200;

const BOOKMARKS_ENABLED = true;
const BOOKMARKS_SYNC_ENABLED = false;

const AD_BLOCK_ENABLED = true;
const AD_BLOCK_FILTER_LIST_UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

const UI_THEME = process.env.UI_THEME || 'dark';
const UI_FONT_SIZE = process.env.UI_FONT_SIZE || 14;
const UI_FONT_FAMILY = process.env.UI_FONT_FAMILY || 'Arial, sans-serif';

// QUIC protocol and HTTP/3 configuration
const QUIC_ENABLED = process.env.QUIC_ENABLED === 'true' || true;
const QUIC_PORT = process.env.QUIC_PORT || 443;
const QUIC_PROTOCOL_VERSION = process.env.QUIC_PROTOCOL_VERSION || 'draft-29';
const QUIC_SPINNING_BIT = process.env.QUIC_SPINNING_BIT === 'true' || true;

const HTTP3_ENABLED = process.env.HTTP3_ENABLED === 'true' || true;
const HTTP3_PORT = process.env.HTTP3_PORT || 443;
const HTTP3_PROTOCOL_VERSION = process.env.HTTP3_PROTOCOL_VERSION || 'HTTP/3';

const QUIC_HEADER_REWRITE_RULES = {
  'Content-Security-Policy': (value) => value.replace('default-src', 'script-src \'self\''),
};