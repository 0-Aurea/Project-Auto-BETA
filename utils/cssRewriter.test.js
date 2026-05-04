const { describe, it, expect } = require('@jest/globals');
const CssRewriter = require('./cssRewriter');

describe('CssRewriter', () => {
  it('should handle url() rewrites', () => {
    const originalCss = 'body { background-image: url("https://example.com/image.jpg"); }';
    const rewrittenCss = CssRewriter.rewriteCss(originalCss, 'https://proxy.example.com');
    expect(rewrittenCss).toBe('body { background-image: url("https://proxy.example.com/https://example.com/image.jpg"); }');
  });

  it('should handle @import rewrites', () => {
    const originalCss = '@import "https://example.com/style.css";';
    const rewrittenCss = CssRewriter.rewriteCss(originalCss, 'https://proxy.example.com');
    expect(rewrittenCss).toBe('@import "https://proxy.example.com/https://example.com/style.css";');
  });

  it('should handle content: url(...) rewrites', () => {
    const originalCss = 'body { content: url("https://example.com/icon.png"); }';
    const rewrittenCss = CssRewriter.rewriteCss(originalCss, 'https://proxy.example.com');
    expect(rewrittenCss).toBe('body { content: url("https://proxy.example.com/https://example.com/icon.png"); }');
  });

  it('should handle CSS @charset rewrites', () => {
    const originalCss = '@charset "UTF-8";';
    const rewrittenCss = CssRewriter.rewriteCss(originalCss, 'https://proxy.example.com');
    expect(rewrittenCss).toBe('@charset "UTF-8";');
  });

  it('should handle empty CSS files', () => {
    const originalCss = '';
    const rewrittenCss = CssRewriter.rewriteCss(originalCss, 'https://proxy.example.com');
    expect(rewrittenCss).toBe('');
  });

  it('should handle CSS files with only comments', () => {
    const originalCss = '/* comment */';
    const rewrittenCss = CssRewriter.rewriteCss(originalCss, 'https://proxy.example.com');
    expect(rewrittenCss).toBe('/* comment */');
  });

  it('should handle complex CSS files with multiple rules', () => {
    const originalCss = `
      body {
        background-image: url("https://example.com/image.jpg");
      }

      @import "https://example.com/style.css";

      .class {
        content: url("https://example.com/icon.png");
      }
    `;
    const rewrittenCss = CssRewriter.rewriteCss(originalCss, 'https://proxy.example.com');
    expect(rewrittenCss).toBe(`
      body {
        background-image: url("https://proxy.example.com/https://example.com/image.jpg");
      }

      @import "https://proxy.example.com/https://example.com/style.css";

      .class {
        content: url("https://proxy.example.com/https://example.com/icon.png");
      }
    `);
  });
});