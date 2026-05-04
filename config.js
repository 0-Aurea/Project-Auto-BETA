const CACHE_NAME = process.env.CACHE_NAME || 'nexus-cache';
const VERSION = process.env.VERSION || '1.0.0';
const SALT_ROTATION_INTERVAL = process.env.SALT_ROTATION_INTERVAL ? parseInt(process.env.SALT_ROTATION_INTERVAL) : 30 * 60 * 1000; // 30 minutes

const ENCODING_MODES = process.env.ENCODING_MODES ? process.env.ENCODING_MODES.split(',') : ['xor', 'base64'];
const DEFAULT_ENCODING_MODE = process.env.DEFAULT_ENCODING_MODE || 'xor';

const MAX_CACHE_AGE = process.env.MAX_CACHE_AGE ? parseInt(process.env.MAX_CACHE_AGE) : 24 * 60 * 60 * 1000; // 24 hours
const PREFETCH_CACHE_AGE = process.env.PREFETCH_CACHE_AGE ? parseInt(process.env.PREFETCH_CACHE_AGE) : 5 * 60 * 60 * 1000; // 5 hours

const AD_BLOCK_FILTER_LIST_URL = process.env.AD_BLOCK_FILTER_LIST_URL || 'https://raw.githubusercontent.com/brave/adblock-lists/master/ublock-origin-default.txt';
const HOSTS_FILE_URL = process.env.HOSTS_FILE_URL || 'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts';

const BOOKMARKS_STORAGE_KEY = process.env.BOOKMARKS_STORAGE_KEY || 'nexus-bookmarks';
const PROXY_HISTORY_STORAGE_KEY = process.env.PROXY_HISTORY_STORAGE_KEY || 'nexus-proxy-history';
const SETTINGS_STORAGE_KEY = process.env.SETTINGS_STORAGE_KEY || 'nexus-settings';

const SSL_CERT_FILE = process.env.SSL_CERT_FILE || 'path/to/ssl/cert.crt';
const SSL_KEY_FILE = process.env.SSL_KEY_FILE || 'path/to/ssl/key.key';
const HTTPS_PORT = process.env.HTTPS_PORT ? parseInt(process.env.HTTPS_PORT) : 443;
const TLS_PROTOCOLS = process.env.TLS_PROTOCOLS ? process.env.TLS_PROTOCOLS.split(',') : ['TLSv1.2', 'TLSv1.3'];

const WEBSOCKET_TIMEOUT = process.env.WEBSOCKET_TIMEOUT ? parseInt(process.env.WEBSOCKET_TIMEOUT) : 30 * 1000; // 30 seconds
const WEBSOCKET_KEEP_ALIVE_INTERVAL = process.env.WEBSOCKET_KEEP_ALIVE_INTERVAL ? parseInt(process.env.WEBSOCKET_KEEP_ALIVE_INTERVAL) : 10 * 1000; // 10 seconds
const WEBSOCKET_PING_INTERVAL = process.env.WEBSOCKET_PING_INTERVAL ? parseInt(process.env.WEBSOCKET_PING_INTERVAL) : 5 * 1000; // 5 seconds
const WEBSOCKET_PONG_TIMEOUT = process.env.WEBSOCKET_PONG_TIMEOUT ? parseInt(process.env.WEBSOCKET_PONG_TIMEOUT) : 5 * 1000; // 5 seconds

const WEBSOCKET_SETTINGS = {
  connectionTimeout: WEBSOCKET_TIMEOUT,
  keepAliveInterval: WEBSOCKET_KEEP_ALIVE_INTERVAL,
  pingInterval: WEBSOCKET_PING_INTERVAL,
  pongTimeout: WEBSOCKET_PONG_TIMEOUT,
};

const WEBRTC_SETTINGS = {
  iceCandidateScrubbing: process.env.WEBSOCKET_ICE_CANDIDATE_SCRUBBING !== 'false',
  peerConnectionConfig: {
    iceServers: [],
    iceCandidatePoolSize: 0,
  },
};

const COOKIE_SCOPING_ENABLED = process.env.COOKIE_SCOPING_ENABLED !== 'false';
const COOKIE_STORAGE_KEY = process.env.COOKIE_STORAGE_KEY || 'nexus-cookies';

const HEADER_REWRITE_RULES = {
  'Content-Security-Policy': (value) => value.replace('default-src', 'script-src \'self\''),
  'X-Frame-Options': (value) => value.replace('SAMEORIGIN', '*'),
  'Strict-Transport-Security': (value) => '',
  'X-Content-Type-Options': (value) => value.replace('nosniff', ''),
};

const INTEGRATED_HTTPS_TUNNEL = process.env.INTEGRATED_HTTPS_TUNNEL !== 'false';
const WEBSOCKET_UPGRADE_PROXYING = process.env.WEBSOCKET_UPGRADE_PROXYING !== 'false';

const CACHE_TTL_HEADERS = process.env.CACHE_TTL_HEADERS ? process.env.CACHE_TTL_HEADERS.split(',') : ['Cache-Control', 'Expires'];
const CACHE_REVALIDATE_THRESHOLD = process.env.CACHE_REVALIDATE_THRESHOLD ? parseInt(process.env.CACHE_REVALIDATE_THRESHOLD) : 5 * 60 * 1000; // 5 minutes
const CACHE_SIZE_LIMIT = process.env.CACHE_SIZE_LIMIT ? parseInt(process.env.CACHE_SIZE_LIMIT) : 100 * 1024 * 1024; // 100MB

const PREFETCH_HINTS_ENABLED = process.env.PREFETCH_HINTS_ENABLED !== 'false';
const PREFETCH_HINTS_CACHE_AGE = process.env.PREFETCH_HINTS_CACHE_AGE ? parseInt(process.env.PREFETCH_HINTS_CACHE_AGE) : 24 * 60 * 60 * 1000; // 24 hours

const COMPRESSION_ENABLED = process.env.COMPRESSION_ENABLED !== 'false';
const BROTLI_COMPRESSION_THRESHOLD = process.env.BROTLI_COMPRESSION_THRESHOLD ? parseInt(process.env.BROTLI_COMPRESSION_THRESHOLD) : 1024; // bytes
const GZIP_COMPRESSION_THRESHOLD = process.env.GZIP_COMPRESSION_THRESHOLD ? parseInt(process.env.GZIP_COMPRESSION_THRESHOLD) : 1024; // bytes
const COMPRESSION_MIN_SIZE = process.env.COMPRESSION_MIN_SIZE ? parseInt(process.env.COMPRESSION_MIN_SIZE) : 100; // bytes
const COMPRESSION_MAX_SIZE = process.env.COMPRESSION_MAX_SIZE ? parseInt(process.env.COMPRESSION_MAX_SIZE) : 10 * 1024 * 1024; // 10MB
const COMPRESSION_QUALITY = process.env.COMPRESSION_QUALITY ? parseInt(process.env.COMPRESSION_QUALITY) : 6; // 0-11

const CONNECTION_TIMEOUT = process.env.CONNECTION_TIMEOUT ? parseInt(process.env.CONNECTION_TIMEOUT) : 10 * 1000; // 10 seconds
const SOCKET_TIMEOUT = process.env.SOCKET_TIMEOUT ? parseInt(process.env.SOCKET_TIMEOUT) : 30 * 1000; // 30 seconds

const TAB_BAR_ENABLED = process.env.TAB_BAR_ENABLED !== 'false';
const TAB_BAR_WIDTH = process.env.TAB_BAR_WIDTH ? parseInt(process.env.TAB_BAR_WIDTH) : 250;
const TAB_BAR_HEIGHT = process.env.TAB_BAR_HEIGHT ? parseInt(process.env.TAB_BAR_HEIGHT) : 40;

const SETTINGS_PANEL_ENABLED = process.env.SETTINGS_PANEL_ENABLED !== 'false';
const SETTINGS_PANEL_WIDTH = process.env.SETTINGS_PANEL_WIDTH ? parseInt(process.env.SETTINGS_PANEL_WIDTH) : 300;
const SETTINGS_PANEL_HEIGHT = process.env.SETTINGS_PANEL_HEIGHT ? parseInt(process.env.SETTINGS_PANEL_HEIGHT) : 200;

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
  WEBSOCKET_SETTINGS,
  WEBRTC_SETTINGS,
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
  COMPRESSION_QUALITY,
  CONNECTION_TIMEOUT,
  SOCKET_TIMEOUT,
  TAB_BAR_ENABLED,
  TAB_BAR_WIDTH,
  TAB_BAR_HEIGHT,
  SETTINGS_PANEL_ENABLED,
  SETTINGS_PANEL_WIDTH,
  SETTINGS_PANEL_HEIGHT,
};