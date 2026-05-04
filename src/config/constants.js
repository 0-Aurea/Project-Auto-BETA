const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');
const LRU = require('lru-cache');
const crypto = require('crypto');
const tls = require('tls');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const cache = new LRU({
  max: 1000,
  maxAge: 1000 * 60 * 60 // 1 hour
});

const rotatingSalt = crypto.randomBytes(16).toString('hex');

const DEFAULT_ENCODING = 'xor_base64';
const URL_PREFIX = '/_nexus';
const SALT_LENGTH = 16;
const ENCODING_MODES = ['xor_base64', 'base64'];
const DEFAULT_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000;
const WEBSOCKET_PROTOCOL = 'ws';
const HOSTS_FILE = 'hosts.txt';
const AD_BLOCK_FILE = 'adblock.txt';
const BOOKMARKS_FILE = 'bookmarks.json';
const PROXY_HISTORY_DB = 'proxy_history.db';
const SETTINGS_FILE = 'settings.json';
const UA_STRING = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.3';
const FETCH_TIMEOUT = 10000; // 10 seconds
const SSL_CERT_FILE = 'ssl_cert.crt';
const SSL_KEY_FILE = 'ssl_key.key';

module.exports = {
  DEFAULT_ENCODING,
  URL_PREFIX,
  SALT_LENGTH,
  ENCODING_MODES,
  DEFAULT_CACHE_TTL,
  MAX_CACHE_SIZE,
  WEBSOCKET_PROTOCOL,
  HOSTS_FILE,
  AD_BLOCK_FILE,
  BOOKMARKS_FILE,
  PROXY_HISTORY_DB,
  SETTINGS_FILE,
  UA_STRING,
  FETCH_TIMEOUT,
  SSL_CERT_FILE,
  SSL_KEY_FILE
};