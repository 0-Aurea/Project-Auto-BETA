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
  SETTINGS_STORAGE_KEY
};