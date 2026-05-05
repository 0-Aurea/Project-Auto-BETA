const { describe, it, expect } = require('@jest/globals');
const ProxyEngine = require('./ProxyEngine');
const { URL } = require('url');
const http = require('http');
const https = require('https');
const { Readable } = require('stream');

describe('ProxyEngine', () => {
  let proxyEngine;

  beforeEach(() => {
    proxyEngine = new ProxyEngine();
  });

  describe('scrubWebRTCIceCandidates', () => {
    it('should scrub WebRTC ICE candidates', async () => {
      const request = {
        headers: {
          'content-type': 'application/candidate',
        },
        body: 'candidate:1 1 udp 1 192.168.1.100 1234 typ host',
      };

      const response = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      await proxyEngine.scrubWebRTCIceCandidates(request, response);

      expect(response.writeHead).toHaveBeenCalledTimes(1);
      expect(response.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'application/candidate',
      });

      expect(response.end).toHaveBeenCalledTimes(1);
      expect(response.end).toHaveBeenCalledWith(expect.any(String));
    });

    it('should not scrub non-WebRTC ICE candidates', async () => {
      const request = {
        headers: {
          'content-type': 'application/json',
        },
        body: '{}',
      };

      const response = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      await proxyEngine.scrubWebRTCIceCandidates(request, response);

      expect(response.writeHead).not.toHaveBeenCalled();
      expect(response.end).not.toHaveBeenCalled();
    });
  });

  describe('parseICECandidate', () => {
    it('should parse ICE candidate', async () => {
      const candidate = 'candidate:1 1 udp 1 192.168.1.100 1234 typ host';
      const request = {
        body: candidate,
      };

      const parsedCandidate = await proxyEngine.parseICECandidate(request);

      expect(parsedCandidate).toEqual({
        candidate: '1',
        component: '1',
        protocol: 'udp',
        priority: '1',
        address: '192.168.1.100',
        port: '1234',
        type: 'host',
      });
    });
  });

  describe('scrubICECandidate', () => {
    it('should scrub ICE candidate', () => {
      const candidate = {
        candidate: '1',
        component: '1',
        protocol: 'udp',
        priority: '1',
        address: '192.168.1.100',
        port: '1234',
        type: 'host',
      };

      const scrubbedCandidate = proxyEngine.scrubICECandidate(candidate);

      expect(scrubbedCandidate).not.toContain('192.168.1.100');
    });
  });

  describe('handleRequest', () => {
    it('should handle HTTP requests', async () => {
      const req = {
        url: 'http://example.com',
        headers: {},
        method: 'GET',
      };

      const res = {
        writeHead: jest.fn(),
        end: jest.fn(),
      };

      await proxyEngine.handleRequest(req, res);

      expect(res.writeHead).toHaveBeenCalledTimes(1);
      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it('should handle HTTPS requests', async () => {
      const req = {
        url: 'https://example.com',
        headers: {},
        method: 'GET',
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

  describe('handleWebSocket', () => {
    it('should handle WebSocket connections', async () => {
      const req = {
        url: 'ws://example.com',
        headers: {},
      };

      const socket = {
        on: jest.fn(),
        emit: jest.fn(),
      };

      await proxyEngine.handleWebSocket(req, socket);

      expect(socket.on).toHaveBeenCalledTimes(1);
      expect(socket.emit).toHaveBeenCalledTimes(1);
    });
  });

  describe('rewriteHeaders', () => {
    it('should rewrite response headers', () => {
      const headers = {
        'Content-Security-Policy': 'default-src \'self\'',
        'Strict-Transport-Security': 'max-age=31536000',
        'X-Frame-Options': 'SAMEORIGIN',
      };

      const rewrittenHeaders = proxyEngine.rewriteHeaders(headers);

      expect(rewrittenHeaders).not.toHaveProperty('Content-Security-Policy');
      expect(rewrittenHeaders).not.toHaveProperty('Strict-Transport-Security');
      expect(rewrittenHeaders).not.toHaveProperty('X-Frame-Options');
    });
  });

  describe('rewriteResponse', () => {
    it('should rewrite response body', async () => {
      const response = {
        body: '<html><body>Hello World!</body></html>',
      };

      const rewrittenResponse = await proxyEngine.rewriteResponse(response);

      expect(rewrittenResponse.body).not.toBe(response.body);
    });
  });
});