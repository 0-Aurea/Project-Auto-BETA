const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const JsRewriter = require('./jsRewriter');

describe('JsRewriter', () => {
  let dom;
  let document;
  let window;
  let jsRewriter;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
    document = dom.window.document;
    window = dom.window;
    jsRewriter = new JsRewriter();
  });

  describe('rewriteJs', () => {
    it('should handle eval()', () => {
      const jsCode = 'eval("console.log(\'Hello World\')");';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('eval');
    });

    it('should handle Function()', () => {
      const jsCode = 'const func = new Function("console.log(\'Hello World\')");';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('Function');
    });

    it('should handle dynamic import()', () => {
      const jsCode = 'import("https://example.com/script.js");';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('import');
    });

    it('should handle new Worker()', () => {
      const jsCode = 'const worker = new Worker("https://example.com/worker.js");';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('Worker');
    });

    it('should handle importScripts()', () => {
      const jsCode = 'importScripts("https://example.com/script.js");';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('importScripts');
    });

    it('should handle document.domain mutations', () => {
      const jsCode = 'document.domain = "example.com";';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('document.domain');
    });

    it('should handle window.location', () => {
      const jsCode = 'window.location.href = "https://example.com";';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('window.location');
    });

    it('should handle window.open', () => {
      const jsCode = 'window.open("https://example.com", "_blank");';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('window.open');
    });

    it('should handle history.pushState/replaceState', () => {
      const jsCode = 'history.pushState({}, "", "https://example.com");';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('history.pushState');
    });

    it('should handle inline event handlers', () => {
      const jsCode = '<button onclick="console.log(\'Hello World\')">Click</button>';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('onclick');
    });

    it('should handle source maps', () => {
      const jsCode = '//# sourceMappingURL=https://example.com/source.map';
      const rewrittenJs = jsRewriter.rewriteJs(jsCode, window);
      expect(rewrittenJs).not.toContain('sourceMappingURL');
    });
  });

  describe('rewriteHtml', () => {
    it('should handle src/href/action/srcset/data attributes', () => {
      const htmlCode = '<img src="https://example.com/image.jpg" />';
      const rewrittenHtml = jsRewriter.rewriteHtml(htmlCode, window);
      expect(rewrittenHtml).not.toContain('https://example.com/image.jpg');
    });

    it('should handle <base> tag injection', () => {
      const htmlCode = '<html><head><base href="https://example.com"></head></html>';
      const rewrittenHtml = jsRewriter.rewriteHtml(htmlCode, window);
      expect(rewrittenHtml).not.toContain('https://example.com');
    });

    it('should handle <meta http-equiv="refresh"> rewrites', () => {
      const htmlCode = '<meta http-equiv="refresh" content="5; url=https://example.com">';
      const rewrittenHtml = jsRewriter.rewriteHtml(htmlCode, window);
      expect(rewrittenHtml).not.toContain('https://example.com');
    });

    it('should handle inline <script> and <style> blocks', () => {
      const htmlCode = '<script>console.log("Hello World");</script>';
      const rewrittenHtml = jsRewriter.rewriteHtml(htmlCode, window);
      expect(rewrittenHtml).not.toContain('console.log');
    });

    it('should handle nonce stripping', () => {
      const htmlCode = '<script nonce="abc123">console.log("Hello World");</script>';
      const rewrittenHtml = jsRewriter.rewriteHtml(htmlCode, window);
      expect(rewrittenHtml).not.toContain('nonce');
    });
  });

  describe('rewriteCss', () => {
    it('should handle url()', () => {
      const cssCode = 'background-image: url("https://example.com/image.jpg");';
      const rewrittenCss = jsRewriter.rewriteCss(cssCode, window);
      expect(rewrittenCss).not.toContain('https://example.com/image.jpg');
    });

    it('should handle @import', () => {
      const cssCode = '@import "https://example.com/style.css";';
      const rewrittenCss = jsRewriter.rewriteCss(cssCode, window);
      expect(rewrittenCss).not.toContain('https://example.com/style.css');
    });

    it('should handle content: url(...)', () => {
      const cssCode = 'content: url("https://example.com/image.jpg");';
      const rewrittenCss = jsRewriter.rewriteCss(cssCode, window);
      expect(rewrittenCss).not.toContain('https://example.com/image.jpg');
    });
  });
});