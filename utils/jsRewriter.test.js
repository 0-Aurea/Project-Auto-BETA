const { JSDOM } = require('jsdom');
const { jsRewriter } = require('./jsRewriter');

describe('jsRewriter', () => {
  it('should handle eval()', () => {
    const jsCode = 'eval("console.log(\'Hello World\')");';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('eval');
  });

  it('should handle Function()', () => {
    const jsCode = 'const func = new Function("console.log(\'Hello World\')");';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('Function');
  });

  it('should handle dynamic import()', () => {
    const jsCode = 'import("https://example.com/module.js");';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('import');
  });

  it('should handle new Worker()', () => {
    const jsCode = 'const worker = new Worker("https://example.com/worker.js");';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('Worker');
  });

  it('should handle importScripts()', () => {
    const jsCode = 'importScripts("https://example.com/script.js");';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('importScripts');
  });

  it('should handle document.domain mutations', () => {
    const jsCode = 'document.domain = "example.com";';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('document.domain');
  });

  it('should handle window.location', () => {
    const jsCode = 'window.location.href = "https://example.com";';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('window.location');
  });

  it('should handle window.open', () => {
    const jsCode = 'window.open("https://example.com", "_blank");';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('window.open');
  });

  it('should handle history.pushState/replaceState', () => {
    const jsCode = 'history.pushState({}, "", "https://example.com");';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('history.pushState');
  });

  it('should handle complex code with multiple rewrites', () => {
    const jsCode = `
      eval("console.log(\'Hello World\')");
      const func = new Function("console.log(\'Hello World\')");
      import("https://example.com/module.js");
      const worker = new Worker("https://example.com/worker.js");
      importScripts("https://example.com/script.js");
      document.domain = "example.com";
      window.location.href = "https://example.com";
      window.open("https://example.com", "_blank");
      history.pushState({}, "", "https://example.com");
    `;
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('eval');
    expect(rewrittenJsCode).not.toContain('Function');
    expect(rewrittenJsCode).not.toContain('import');
    expect(rewrittenJsCode).not.toContain('Worker');
    expect(rewrittenJsCode).not.toContain('importScripts');
    expect(rewrittenJsCode).not.toContain('document.domain');
    expect(rewrittenJsCode).not.toContain('window.location');
    expect(rewrittenJsCode).not.toContain('window.open');
    expect(rewrittenJsCode).not.toContain('history.pushState');
  });

  it('should handle sourceMappingURL', () => {
    const jsCode = '//# sourceMappingURL=https://example.com/source.map';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).not.toContain('sourceMappingURL');
  });

  it('should handle empty code', () => {
    const jsCode = '';
    const rewrittenJsCode = jsRewriter(jsCode);
    expect(rewrittenJsCode).toBe('');
  });
});