const { describe, test, expect } = require('@jest/globals');
const proxyEngine = require('../src/core/proxyEngine');

describe('proxyEngine', () => {
  test('should rewrite URL using XOR + base64 encoding with a rotating salt', () => {
    const originalUrl = 'https://example.com';
    const rewrittenUrl = proxyEngine.rewriteUrl(originalUrl);
    expect(rewrittenUrl).not.toBe(originalUrl);
    expect(rewrittenUrl).toMatch(/^([a-zA-Z0-9+/=]+)$/);
  });

  test('should handle HTTPS tunnel without separate bare-server process', async () => {
    const httpsUrl = 'https://example.com';
    const response = await proxyEngine.tunnelHttps(httpsUrl);
    expect(response).toBeInstanceOf(Object);
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThanOrEqual(299);
  });

  test('should rewrite request/response headers', () => {
    const originalHeaders = {
      'Content-Security-Policy': 'default-src \'self\'',
      'Strict-Transport-Security': 'max-age=31536000',
      'X-Frame-Options': 'DENY',
    };
    const rewrittenHeaders = proxyEngine.rewriteHeaders(originalHeaders);
    expect(rewrittenHeaders).not.toHaveProperty('Content-Security-Policy');
    expect(rewrittenHeaders).not.toHaveProperty('Strict-Transport-Security');
    expect(rewrittenHeaders).not.toHaveProperty('X-Frame-Options');
  });

  test('should isolate cookies per proxied origin', () => {
    const cookies = [
      { domain: 'example.com', path: '/' },
      { domain: 'sub.example.com', path: '/' },
    ];
    const isolatedCookies = proxyEngine.isolateCookies(cookies);
    expect(isolatedCookies).toHaveLength(2);
    expect(isolatedCookies[0].domain).toBe('example.com');
    expect(isolatedCookies[1].domain).toBe('sub.example.com');
  });

  test('should handle WebSocket upgrade proxying', async () => {
    const wsUrl = 'wss://example.com';
    const ws = await proxyEngine.proxyWebSocket(wsUrl);
    expect(ws).toBeInstanceOf(Object);
    expect(ws.readyState).toBe(1);
  });

  test('should scrub WebRTC ICE candidates to prevent IP leaks', () => {
    const iceCandidates = [
      { candidate: 'candidate:1 1 udp 1 192.168.1.100 1234 typ host' },
      { candidate: 'candidate:2 1 tcp 1 192.168.1.100 1234 typ host' },
    ];
    const scrubbedCandidates = proxyEngine.scrubIceCandidates(iceCandidates);
    expect(scrubbedCandidates).toHaveLength(2);
    expect(scrubbedCandidates[0].candidate).not.toContain('192.168.1.100');
    expect(scrubbedCandidates[1].candidate).not.toContain('192.168.1.100');
  });

  test('should cache proxied responses with TTL headers', async () => {
    const response = await proxyEngine.cacheResponse('https://example.com', {
      ttl: 3600,
    });
    expect(response).toBeInstanceOf(Object);
    expect(response.cacheControl).toContain('max-age=3600');
  });

  test('should handle brotli/gzip decompression + re-compression pipeline', async () => {
    const compressedData = await proxyEngine.decompressAndRecompress('https://example.com', 'gzip');
    expect(compressedData).toBeInstanceOf(Buffer);
  });

  test('should parse <link rel="prefetch/preload"> and cache ahead', async () => {
    const html = '<html><head><link rel="prefetch" href="https://example.com/prefetch"></head></html>';
    const prefetchUrls = await proxyEngine.parsePrefetchHints(html);
    expect(prefetchUrls).toHaveLength(1);
    expect(prefetchUrls[0]).toBe('https://example.com/prefetch');
  });
});