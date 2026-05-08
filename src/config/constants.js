const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const LRU = require('lru-cache');
const crypto = require('crypto');
const tls = require('tls');
const fs = require('fs');

// Core constants
const DEFAULT_ENCODING = 'xor_base64';
const ENCODING_MODES = ['xor_base64', 'base64'];

// URL and path settings
const URL_PREFIX = '/_nexus';
const API_SERVICE_URL = '/service/';

// Cache settings
const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000;

// WebSocket settings
const WEBSOCKET_PROTOCOL = 'ws';

// File storage settings
const HOSTS_FILE = 'hosts.txt';
const AD_BLOCK_FILE = 'adblock.txt';
const BOOKMARKS_FILE = 'bookmarks.json';
const PROXY_HISTORY_DB = 'proxy_history.db';
const SETTINGS_FILE = 'settings.json';

// Security and encryption
const SALT_LENGTH = 16;
const SALT_ROTATION_INTERVAL = 60000; // 1 minute

// User agent and fetch settings
const UA_STRING = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.3';
const FETCH_TIMEOUT = 10000; // 10 seconds

// SSL/TLS settings
const SSL_CERT_FILE = 'ssl_cert.crt';
const SSL_KEY_FILE = 'ssl_key.key';

// Initialize rotating salt
const rotatingSalt = crypto.randomBytes(SALT_LENGTH);

module.exports = {
  express,
  WebSocket,
  http,
  url,
  LRU,
  crypto,
  tls,
  fs,

  DEFAULT_ENCODING,
  ENCODING_MODES,
  URL_PREFIX,
  API_SERVICE_URL,

  DEFAULT_CACHE_TTL,
  MAX_CACHE_SIZE,

  WEBSOCKET_PROTOCOL,

  HOSTS_FILE,
  AD_BLOCK_FILE,
  BOOKMARKS_FILE,
  PROXY_HISTORY_DB,
  SETTINGS_FILE,

  SALT_LENGTH,
  SALT_ROTATION_INTERVAL,
  rotatingSalt,

  UA_STRING,
  FETCH_TIMEOUT,

  SSL_CERT_FILE,
  SSL_KEY_FILE
};