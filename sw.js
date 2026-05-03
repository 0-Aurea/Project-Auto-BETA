self.importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.13.0/dist/tf.min.js');
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const cacheName = 'nexus-cache';
const cacheVersion = 'v1';
const rotatingSalt = [];
let cache;

async function getCache() {
  if (!cache) {
    cache = await caches.open(cacheName);
  }
  return cache;
}

async function getResponse(request) {
  const cache = await getCache();
  const response = await cache.match(request);
  return response;
}

async function putResponse(request, response) {
  const cache = await getCache();
  await cache.put(request, response);
}

async function deleteResponse(request) {
  const cache = await getCache();
  await cache.delete(request);
}

function generateSalt() {
  const salt = [];
  for (let i = 0; i < 16; i++) {
    salt.push(Math.floor(Math.random() * 256));
  }
  rotatingSalt.push(salt);
  if (rotatingSalt.length > 10) {
    rotatingSalt.shift();
  }
  return salt;
}

function xorBase64Encode(data, salt) {
  const encodedData = [];
  for (let i = 0; i < data.length; i++) {
    encodedData.push(data.charCodeAt(i) ^ salt[i % salt.length]);
  }
  return btoa(String.fromCharCode(...encodedData));
}

function xorBase64Decode(data, salt) {
  const decodedData = atob(data);
  const decodedArray = [];
  for (let i = 0; i < decodedData.length; i++) {
    decodedArray.push(decodedData.charCodeAt(i) ^ salt[i % salt.length]);
  }
  return String.fromCharCode(...decodedArray);
}

class JSRewriter {
  constructor() {
    this.scriptRegex = /(?:eval|Function|import|require)\(/g;
    this.dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
    this.workerRegex = /new\s+Worker\(['"]([^'"]+)['"]\)/g;
    this.importScriptsRegex = /importScripts\(['"]([^'"]+)['"]\)/g;
    this.documentDomainRegex = /document\.domain\s*=\s*['"]([^'"]+)['"]/g;
    this.windowLocationRegex = /window\.location\s*=\s*['"]([^'"]+)['"]/g;
    this.windowOpenRegex = /window\.open\(['"]([^'"]+)['"]\)/g;
    this.historyPushStateRegex = /history\.pushState\(/g;
    this.historyReplaceStateRegex = /history\.replaceState\(/g;
  }

  rewriteJS(js) {
    js = js.replace(this.scriptRegex, (match) => {
      if (match.startsWith('eval(')) {
        return `eval(${this.rewriteEval(match)})`;
      } else if (match.startsWith('Function(')) {
        return `Function(${this.rewriteFunction(match)})`;
      } else if (match.startsWith('import(')) {
        return `import(${this.rewriteDynamicImport(match)})`;
      } else if (match.startsWith('require(')) {
        return `require(${this.rewriteRequire(match)})`;
      }
      return match;
    });

    js = js.replace(this.dynamicImportRegex, (match, p1) => {
      return `import('${this.rewriteURL(p1)}')`;
    });

    js = js.replace(this.workerRegex, (match, p1) => {
      return `new Worker('${this.rewriteURL(p1)}')`;
    });

    js = js.replace(this.importScriptsRegex, (match, p1) => {
      return `importScripts('${this.rewriteURL(p1)}')`;
    });

    js = js.replace(this.documentDomainRegex, (match, p1) => {
      return `document.domain = '${this.rewriteURL(p1)}'`;
    });

    js = js.replace(this.windowLocationRegex, (match, p1) => {
      return `window.location = '${this.rewriteURL(p1)}'`;
    });

    js = js.replace(this.windowOpenRegex, (match, p1) => {
      return `window.open('${this.rewriteURL(p1)}')`;
    });

    js = js.replace(this.historyPushStateRegex, (match) => {
      return `history.pushState(${this.rewriteHistoryPushState(match)})`;
    });

    js = js.replace(this.historyReplaceStateRegex, (match) => {
      return `history.replaceState(${this.rewriteHistoryReplaceState(match)})`;
    });

    return js;
  }

  rewriteEval(match) {
    const code = match.slice(5, -1);
    return this.rewriteJS(code);
  }

  rewriteFunction(match) {
    const args = match.slice(9, -1);
    const code = args + '{' + this.rewriteJS(match.slice(match.indexOf('{') + 1, -1)) + '}';
    return code;
  }

  rewriteDynamicImport(match) {
    return this.rewriteURL(match.slice(7, -1));
  }

  rewriteRequire(match) {
    return this.rewriteURL(match.slice(8, -1));
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }

  rewriteHistoryPushState(match) {
    return match.slice(17);
  }

  rewriteHistoryReplaceState(match) {
    return match.slice(19);
  }
}

class HTMLRewriter {
  constructor() {
    this.srcRegex = /src\s*=\s*['"]([^'"]+)['"]/g;
    this.hrefRegex = /href\s*=\s*['"]([^'"]+)['"]/g;
    this.actionRegex = /action\s*=\s*['"]([^'"]+)['"]/g;
    this.srcsetRegex = /srcset\s*=\s*['"]([^'"]+)['"]/g;
    this.dataRegex = /data\s*=\s*['"]([^'"]+)['"]/g;
  }

  rewriteHTML(html) {
    html = html.replace(this.srcRegex, (match, p1) => {
      return `src="${this.rewriteURL(p1)}"`;
    });

    html = html.replace(this.hrefRegex, (match, p1) => {
      return `href="${this.rewriteURL(p1)}"`;
    });

    html = html.replace(this.actionRegex, (match, p1) => {
      return `action="${this.rewriteURL(p1)}"`;
    });

    html = html.replace(this.srcsetRegex, (match, p1) => {
      return `srcset="${this.rewriteURL(p1)}"`;
    });

    html = html.replace(this.dataRegex, (match, p1) => {
      return `data="${this.rewriteURL(p1)}"`;
    });

    return html;
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }
}

class CSSRewriter {
  constructor() {
    this.urlRegex = /url\(\s*['"]([^'"]+)['"]\s*\)/g;
    this.importRegex = /@import\s*['"]([^'"]+)['"]/g;
    this.contentRegex = /content:\s*url\(\s*['"]([^'"]+)['"]\s*\)/g;
  }

  rewriteCSS(css) {
    css = css.replace(this.urlRegex, (match, p1) => {
      return `url(${this.rewriteURL(p1)})`;
    });

    css = css.replace(this.importRegex, (match, p1) => {
      return `@import ${this.rewriteURL(p1)}`;
    });

    css = css.replace(this.contentRegex, (match, p1) => {
      return `content: url(${this.rewriteURL(p1)})`;
    });

    return css;
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }
}

addEventListener('fetch', async (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const cache = await getCache();
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      event.respondWith(cachedResponse);
      return;
    }
  }

  const response = await fetch(request);
  const clonedResponse = response.clone();

  const jsRewriter = new JSRewriter();
  const htmlRewriter = new HTMLRewriter();
  const cssRewriter = new CSSRewriter();

  let body = await response.text();

  if (body && body.startsWith('<!DOCTYPE html>')) {
    body = htmlRewriter.rewriteHTML(body);
  }

  if (body && body.startsWith('{') && body.endsWith('}')) {
    try {
      const json = JSON.parse(body);
      body = JSON.stringify(json);
    } catch (e) {}
  }

  if (body && body.includes('script')) {
    body = jsRewriter.rewriteJS(body);
  }

  if (body && body.includes('url(')) {
    body = cssRewriter.rewriteCSS(body);
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'max-age=3600');

  const rewrittenResponse = new Response(body, {
    status: response.status,
    headers: headers,
  });

  event.respondWith(rewrittenResponse);

  putResponse(request, clonedResponse);
});

addEventListener('scheduled', async (event) => {
  const cache = await getCache();
  await cache.keys().then(async (keys) => {
    for (const key of keys) {
      const response = await cache.get(key);
      if (response) {
        const headers = response.headers;
        const ttl = headers.get('ttl');
        if (ttl && Date.now() > ttl) {
          await cache.delete(key);
        }
      }
    }
  });
});

generateSalt();