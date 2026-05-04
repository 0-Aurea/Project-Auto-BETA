const { describe, it, expect } = require('@jest/globals');
const { jsRewriter } = require('./jsRewriter');

describe('jsRewriter', () => {
  it('should rewrite eval() calls', () => {
    const originalCode = 'eval("console.log(123)");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('eval');
  });

  it('should rewrite Function() calls', () => {
    const originalCode = 'const func = new Function("console.log(123)");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('Function');
  });

  it('should rewrite dynamic import() calls', () => {
    const originalCode = 'import("https://example.com/module.js");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('import');
  });

  it('should rewrite Web Worker creation', () => {
    const originalCode = 'new Worker("https://example.com/worker.js");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('Worker');
  });

  it('should rewrite importScripts() calls', () => {
    const originalCode = 'importScripts("https://example.com/script.js");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('importScripts');
  });

  it('should rewrite document.domain mutations', () => {
    const originalCode = 'document.domain = "example.com";';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('document.domain');
  });

  it('should rewrite window.location assignments', () => {
    const originalCode = 'window.location.href = "https://example.com";';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('window.location');
  });

  it('should rewrite window.open calls', () => {
    const originalCode = 'window.open("https://example.com");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('window.open');
  });

  it('should rewrite history.pushState calls', () => {
    const originalCode = 'history.pushState({}, "", "https://example.com");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('history.pushState');
  });

  it('should rewrite history.replaceState calls', () => {
    const originalCode = 'history.replaceState({}, "", "https://example.com");';
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('history.replaceState');
  });

  it('should handle complex code with multiple rewrites', () => {
    const originalCode = `
      eval("console.log(123)");
      const func = new Function("console.log(456)");
      import("https://example.com/module.js");
      new Worker("https://example.com/worker.js");
      importScripts("https://example.com/script.js");
      document.domain = "example.com";
      window.location.href = "https://example.com";
      window.open("https://example.com");
      history.pushState({}, "", "https://example.com");
      history.replaceState({}, "", "https://example.com");
    `;
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('eval');
    expect(rewrittenCode).not.toContain('Function');
    expect(rewrittenCode).not.toContain('import');
    expect(rewrittenCode).not.toContain('Worker');
    expect(rewrittenCode).not.toContain('importScripts');
    expect(rewrittenCode).not.toContain('document.domain');
    expect(rewrittenCode).not.toContain('window.location');
    expect(rewrittenCode).not.toContain('window.open');
    expect(rewrittenCode).not.toContain('history.pushState');
    expect(rewrittenCode).not.toContain('history.replaceState');
  });

  it('should handle sourceMappingURL', () => {
    const originalCode = `
      //# sourceMappingURL=example.js.map
      console.log(123);
    `;
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).not.toContain('sourceMappingURL');
  });

  it('should handle complex code with JSON.parse and JSON.stringify', () => {
    const originalCode = `
      const obj = { foo: 'bar' };
      const json = JSON.stringify(obj);
      const parsedObj = JSON.parse(json);
      console.log(parsedObj);
    `;
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).toContain('JSON.stringify');
    expect(rewrittenCode).toContain('JSON.parse');
  });

  it('should handle code with RegExp', () => {
    const originalCode = `
      const regex = new RegExp('foo', 'g');
      console.log(regex);
    `;
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).toContain('RegExp');
  });

  it('should handle code with Date', () => {
    const originalCode = `
      const date = new Date();
      console.log(date);
    `;
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).toContain('Date');
  });

  it('should handle code with Array and Object methods', () => {
    const originalCode = `
      const arr = [1, 2, 3];
      console.log(arr.map(x => x * 2));
      const obj = { foo: 'bar' };
      console.log(Object.keys(obj));
    `;
    const rewrittenCode = jsRewriter(originalCode);
    expect(rewrittenCode).toContain('map');
    expect(rewrittenCode).toContain('Object.keys');
  });
});