import { ProxyEngine } from './ProxyEngine.js';
import { EncodingUtils } from '../utils/encodingUtils.js';
import { URL_PREFIX, DEFAULT_ENCODING, SALT_LENGTH, cache, rotatingSalt, wss, server, app } from '../config/constants.js';
import axios from 'axios';
import { createReadStream, createWriteStream, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import LRU from 'lru-cache';
import crypto from 'crypto';
import tls from 'tls';

describe('ProxyEngine', () => {
  let proxyEngine;

  beforeEach(() => {
    proxyEngine = new ProxyEngine();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize the proxy engine with default settings', () => {
      expect(proxyEngine).toBeInstanceOf(ProxyEngine);
      expect(proxyEngine.encoding).toBe(DEFAULT_ENCODING);
      expect(proxyEngine.salt).toBe(rotatingSalt);
      expect(proxyEngine.cache).toBe(cache);
    });
  });

  describe('encodeUrl', () => {
    it('should encode a URL using the XOR + base64 encoding scheme', () => {
      const urlToEncode = 'https://example.com';
      const encodedUrl = proxyEngine.encodeUrl(urlToEncode);
      expect(encodedUrl).not.toBe(urlToEncode);
      expect(EncodingUtils.decodeUrl(encodedUrl, proxyEngine.salt)).toBe(urlToEncode);
    });

    it('should rotate the salt after a certain interval', async () => {
      const initialSalt = proxyEngine.salt;
      await new Promise(resolve => setTimeout(resolve, EncodingUtils.SALT_ROTATION_INTERVAL + 1));
      expect(proxyEngine.salt).not.toBe(initialSalt);
    });
  });

  describe('decodeUrl', () => {
    it('should decode a URL encoded using the XOR + base64 encoding scheme', () => {
      const urlToEncode = 'https://example.com';
      const encodedUrl = proxyEngine.encodeUrl(urlToEncode);
      const decodedUrl = proxyEngine.decodeUrl(encodedUrl);
      expect(decodedUrl).toBe(urlToEncode);
    });
  });

  describe('rewriteHtml', () => {
    it('should rewrite HTML to redirect sub-requests through the proxy', () => {
      const html = '<html><body><img src="https://example.com/image.jpg"></body></html>';
      const rewrittenHtml = proxyEngine.rewriteHtml(html);
      expect(rewrittenHtml).not.toBe(html);
      expect(rewrittenHtml).toContain(URL_PREFIX);
    });
  });

  describe('rewriteJs', () => {
    it('should rewrite JavaScript to handle dynamic imports and eval()', () => {
      const js = 'import("https://example.com/script.js"); eval("console.log(\'Hello World\')");';
      const rewrittenJs = proxyEngine.rewriteJs(js);
      expect(rewrittenJs).not.toBe(js);
      expect(rewrittenJs).toContain(URL_PREFIX);
    });
  });

  describe('rewriteCss', () => {
    it('should rewrite CSS to handle url() and @import', () => {
      const css = 'body { background-image: url("https://example.com/background.jpg"); } @import "https://example.com/style.css";';
      const rewrittenCss = proxyEngine.rewriteCss(css);
      expect(rewrittenCss).not.toBe(css);
      expect(rewrittenCss).toContain(URL_PREFIX);
    });
  });

  describe('handleWebSocket', () => {
    it('should handle WebSocket upgrades and header rewriting', () => {
      const ws = new WebSocket('ws://example.com');
      proxyEngine.handleWebSocket(ws);
      expect(ws._socket._header).toContain('Upgrade: websocket');
    });
  });

  describe('handleRequest', () => {
    it('should handle incoming requests and proxy them to the target URL', async () => {
      const req = {
        url: 'https://example.com',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      };
      const res = {
        writeHead: jest.fn(),
        end: jest.fn()
      };
      await proxyEngine.handleRequest(req, res);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('cache', () => {
    it('should cache proxied responses with TTL headers', async () => {
      const req = {
        url: 'https://example.com',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      };
      const res = {
        writeHead: jest.fn(),
        end: jest.fn(),
        headers: {
          'Cache-Control': 'max-age=3600'
        }
      };
      await proxyEngine.handleRequest(req, res);
      expect(cache.get(req.url)).not.toBeUndefined();
    });
  });
});