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

  describe('handleWebSocketUpgrade', () => {
    it('should handle WebSocket upgrade requests', async () => {
      const req = {
        headers: {
          'upgrade': 'websocket',
          'connection': 'Upgrade',
          'sec-websocket-key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'sec-websocket-version': '13'
        }
      };
      const res = {
        writeHead: jest.fn(),
        end: jest.fn()
      };
      const socket = {
        on: jest.fn(),
        emit: jest.fn()
      };
      await proxyEngine.handleWebSocketUpgrade(req, res, socket);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(socket.on).toHaveBeenCalledTimes(1);
      expect(socket.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('scrubWebRtcIceCandidates', () => {
    it('should scrub WebRTC ICE candidate IP addresses', () => {
      const candidate = {
        candidate: 'candidate:0 1 1 0.0.0.0 1234 typ host generation 0',
        sdpMLineIndex: 0,
        sdpMid: 'audio'
      };
      const scrubbedCandidate = proxyEngine.scrubWebRtcIceCandidates(candidate);
      expect(scrubbedCandidate.candidate).not.toContain('0.0.0.0');
    });
  });

  describe('cacheResponse', () => {
    it('should cache proxied responses with TTL headers', async () => {
      const req = {
        url: 'https://example.com',
        headers: {
          'cache-control': 'max-age=3600'
        }
      };
      const res = {
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
          'cache-control': 'max-age=3600'
        },
        body: 'Hello World'
      };
      await proxyEngine.cacheResponse(req, res);
      expect(cache.get(req.url)).not.toBeUndefined();
    });
  });

  describe('getCachedResponse', () => {
    it('should retrieve cached responses', async () => {
      const req = {
        url: 'https://example.com',
        headers: {
          'cache-control': 'max-age=3600'
        }
      };
      const res = {
        statusCode: 200,
        headers: {
          'content-type': 'text/html',
          'cache-control': 'max-age=3600'
        },
        body: 'Hello World'
      };
      await proxyEngine.cacheResponse(req, res);
      const cachedRes = await proxyEngine.getCachedResponse(req);
      expect(cachedRes).not.toBeUndefined();
      expect(cachedRes.statusCode).toBe(200);
      expect(cachedRes.headers['content-type']).toBe('text/html');
      expect(cachedRes.body).toBe('Hello World');
    });
  });
});