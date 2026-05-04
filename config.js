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
  // Add WebSocket subprotocol support
  subprotocols: ['nexus-ws'],
  // WebSocket connection headers
  connectionHeaders: {
    'Sec-WebSocket-Protocol': 'nexus-ws',
  },
};

const WEBRTC_SETTINGS = {
  iceCandidateScrubbing: process.env.WEBSOCKET_ICE_CANDIDATE_SCRUBBING !== 'false',
  peerConnectionConfig: {
    iceServers: [],
    iceCandidatePoolSize: 0,
  },
  // WebRTC data channel settings
  dataChannel: {
    // Enable or disable WebRTC data channel
    enabled: true,
    // Data channel label
    label: 'nexus-data-channel',
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
};