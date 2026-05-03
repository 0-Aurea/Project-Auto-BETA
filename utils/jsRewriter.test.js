const { describe, test, expect } = require('@jest/globals');
const { JSRewriterUtils } = require('./jsRewriter');

describe('JSRewriterUtils', () => {
  test('rewrites eval() calls', () => {
    const js = 'eval("console.log(123)");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('eval');
  });

  test('rewrites Function() calls', () => {
    const js = 'const func = new Function("console.log(123)");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('Function');
  });

  test('rewrites dynamic import() calls', () => {
    const js = 'import("https://example.com/script.js");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('import');
  });

  test('rewrites Web Worker creation', () => {
    const js = 'new Worker("https://example.com/worker.js");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('Worker');
  });

  test('rewrites importScripts() calls', () => {
    const js = 'importScripts("https://example.com/script.js");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('importScripts');
  });

  test('rewrites document.domain mutations', () => {
    const js = 'document.domain = "example.com";';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('document.domain');
  });

  test('rewrites window.location assignments', () => {
    const js = 'window.location.href = "https://example.com";';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('window.location');
  });

  test('rewrites window.open() calls', () => {
    const js = 'window.open("https://example.com", "_blank");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('window.open');
  });

  test('rewrites history.pushState() calls', () => {
    const js = 'history.pushState({}, "", "https://example.com");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('history.pushState');
  });

  test('rewrites history.replaceState() calls', () => {
    const js = 'history.replaceState({}, "", "https://example.com");';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('history.replaceState');
  });

  test('handles source maps', () => {
    const js = '//# sourceMappingURL=https://example.com/source.map';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).not.toContain('sourceMappingURL');
  });

  test('preserves strict mode', () => {
    const js = '"use strict"; console.log(123);';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).toContain('"use strict"');
  });

  test('preserves comments', () => {
    const js = 'console.log(123); // This is a comment';
    const rewrittenJs = JSRewriterUtils.rewrite(js, 'https://example.com');
    expect(rewrittenJs).toContain('// This is a comment');
  });
});