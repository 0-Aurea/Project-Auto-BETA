self.addEventListener('activate', async (event) => {
  event.waitUntil(getCache().then((cache) => cache.keys()).then((keys) => {
    return Promise.all(keys.map((key) => cache.delete(key)));
  }));
});

self.addEventListener('fetch', async (event) => {
  event.respondWith(handleFetch(event.request));
});

self.addEventListener('message', async (event) => {
  if (event.data.type === 'ping') {
    event.ports[0].postMessage('pong');
  }
});

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
      return `history.pushState(${this.rewriteHistoryState(match)})`;
    });

    js = js.replace(this.historyReplaceStateRegex, (match) => {
      return `history.replaceState(${this.rewriteHistoryState(match)})`;
    });

    return js;
  }

  rewriteEval(evalStr) {
    return evalStr.replace(/[^\(]+/, (match) => {
      return this.rewriteJS(match);
    });
  }

  rewriteFunction(funcStr) {
    return funcStr.replace(/[^\(]+/, (match) => {
      return this.rewriteJS(match);
    });
  }

  rewriteDynamicImport(importStr) {
    return this.rewriteURL(importStr);
  }

  rewriteRequire(requireStr) {
    return this.rewriteURL(requireStr);
  }

  rewriteURL(url) {
    // TO DO: implement URL rewriting
    return url;
  }

  rewriteHistoryState(stateStr) {
    return stateStr;
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
    // TO DO: implement URL rewriting
    return url;
  }
}

class CSSRewriter {
  constructor() {
    this.urlRegex = /url\(\s*['"]([^'"]+)['"]\s*\)/g;
    this.importRegex = /@import\s+['"]([^'"]+)['"]/g;
  }

  rewriteCSS(css) {
    css = css.replace(this.urlRegex, (match, p1) => {
      return `url(${this.rewriteURL(p1)})`;
    });

    css = css.replace(this.importRegex, (match, p1) => {
      return `@import ${this.rewriteURL(p1)}`;
    });

    return css;
  }

  rewriteURL(url) {
    // TO DO: implement URL rewriting
    return url;
  }
}

async function handleFetch(request) {
  const url = new URL(request.url);
  const salt = generateSalt();
  const encodedUrl = xorBase64Encode(url.href, salt);

  if (request.method === 'GET') {
    const cachedResponse = await getResponse(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);
    const responseBody = await response.clone().text();
    const rewrittenResponseBody = rewriteResponseBody(responseBody, request);

    const rewrittenResponse = new Response(rewrittenResponseBody, response.headers);
    await putResponse(request, rewrittenResponse);

    return rewrittenResponse;
  } else if (request.method === 'POST') {
    // TO DO: handle POST requests
  }
}

function rewriteResponseBody(body, request) {
  const contentType = request.headers.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    const htmlRewriter = new HTMLRewriter();
    return htmlRewriter.rewriteHTML(body);
  } else if (contentType && contentType.includes('application/javascript')) {
    const jsRewriter = new JSRewriter();
    return jsRewriter.rewriteJS(body);
  } else if (contentType && contentType.includes('text/css')) {
    const cssRewriter = new CSSRewriter();
    return cssRewriter.rewriteCSS(body);
  }
  return body;
}