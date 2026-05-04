import { ProxyEngine } from './ProxyEngine.js';
import axios from 'axios';
import { URL_PREFIX, DEFAULT_ENCODING } from '../config/constants.js';
import { EncodingUtils } from '../utils/encodingUtils.js';
import { createReadStream, createWriteStream } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const pipeline = promisify(require('stream').pipeline);
const http = require('http');

describe('ProxyEngine', () => {
  let proxyEngine;

  beforeEach(() => {
    proxyEngine = new ProxyEngine();
  });

  describe('constructor', () => {
    it('should initialize wsClients and cache', () => {
      expect(proxyEngine.wsClients).toBeInstanceOf(Map);
      expect(proxyEngine.cache).toBeInstanceOf(Map);
    });
  });

  describe('handleRequest', () => {
    it('should proxy a request', async () => {
      const req = {
        url: 'https://example.com',
        headers: {
          'User-Agent': 'Test',
        },
      };

      const res = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      await proxyEngine.handleRequest(req, res);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it('should handle a proxied request with a URL prefix', async () => {
      const req = {
        url: `${URL_PREFIX}/https://example.com`,
        headers: {
          'User-Agent': 'Test',
        },
      };

      const res = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      await proxyEngine.handleRequest(req, res);
      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleWebSocketUpgrade', () => {
    it('should proxy a WebSocket upgrade request', async () => {
      const req = {
        url: 'https://example.com',
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade',
        },
      };

      const socket = {
        on: jest.fn(),
        emit: jest.fn(),
      };

      await proxyEngine.handleWebSocketUpgrade(req, socket);
      expect(socket.on).toHaveBeenCalledTimes(1);
      expect(socket.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('rewriteHeaders', () => {
    it('should rewrite response headers', () => {
      const headers = {
        'Content-Security-Policy': 'default-src \'self\';',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Frame-Options': 'SAMEORIGIN',
      };

      const rewrittenHeaders = proxyEngine.rewriteHeaders(headers);
      expect(rewrittenHeaders).not.toHaveProperty('Content-Security-Policy');
      expect(rewrittenHeaders).not.toHaveProperty('Strict-Transport-Security');
      expect(rewrittenHeaders).not.toHaveProperty('X-Frame-Options');
    });
  });

  describe('rewriteRequestHeaders', () => {
    it('should rewrite request headers', () => {
      const headers = {
        'User-Agent': 'Test',
        'Cookie': 'session=abc; user=def',
      };

      const rewrittenHeaders = proxyEngine.rewriteRequestHeaders(headers);
      expect(rewrittenHeaders).not.toHaveProperty('Cookie');
    });
  });

  describe('encodeUrl', () => {
    it('should encode a URL using XOR + base64', () => {
      const url = 'https://example.com';
      const encodedUrl = proxyEngine.encodeUrl(url);
      expect(encodedUrl).not.toBe(url);
    });
  });

  describe('decodeUrl', () => {
    it('should decode a URL encoded using XOR + base64', () => {
      const url = 'https://example.com';
      const encodedUrl = proxyEngine.encodeUrl(url);
      const decodedUrl = proxyEngine.decodeUrl(encodedUrl);
      expect(decodedUrl).toBe(url);
    });
  });

  describe('getSalt', () => {
    it('should get the current salt', () => {
      const salt = EncodingUtils.getSalt();
      expect(salt).toBeInstanceOf(Buffer);
    });
  });

  describe('rotateSalt', () => {
    it('should rotate the salt', async () => {
      const currentSalt = EncodingUtils.getSalt();
      await EncodingUtils.rotateSalt();
      const newSalt = EncodingUtils.getSalt();
      expect(newSalt).not.toEqual(currentSalt);
    });
  });
});