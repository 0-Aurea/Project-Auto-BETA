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

    return js;
  }

  rewriteEval(js) {
    return js.slice(5, -1);
  }

  rewriteFunction(js) {
    return js.slice(9, -1);
  }

  rewriteDynamicImport(js) {
    return js;
  }

  rewriteRequire(js) {
    return js;
  }

  rewriteURL(url) {
    return url.startsWith('/') ? url : `/${url}`;
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
    return url.startsWith('/') ? url : `/${url}`;
  }
}

class CSSRewriter {
  constructor() {
    this.urlRegex = /url\(\s*['"]([^'"]+)['"]\s*\)/g;
    this.importRegex = /@import\s+['"]([^'"]+)['"]/g;
  }

  rewriteCSS(css) {
    css = css.replace(this.urlRegex, (match, p1) => {
      return `url('${this.rewriteURL(p1)}')`;
    });

    css = css.replace(this.importRegex, (match, p1) => {
      return `@import '${this.rewriteURL(p1)}'`;
    });

    return css;
  }

  rewriteURL(url) {
    return url.startsWith('/') ? url : `/${url}`;
  }
}

async function handleFetch(request) {
  const url = new URL(request.url);
  const salt = generateSalt();
  const encodedUrl = xorBase64Encode(url.href, salt);

  const newRequest = new Request(`/${encodedUrl}`, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  const response = await fetch(newRequest);
  const contentType = response.headers.get('Content-Type');

  if (contentType && contentType.includes('text/html')) {
    const html = await response.text();
    const rewriter = new HTMLRewriter();
    const rewrittenHtml = rewriter.rewriteHTML(html);
    const newResponse = new Response(rewrittenHtml, {
      status: response.status,
      headers: response.headers,
    });
    await putResponse(newRequest, newResponse);
    return newResponse;
  } else if (contentType && contentType.includes('text/javascript')) {
    const js = await response.text();
    const rewriter = new JSRewriter();
    const rewrittenJs = rewriter.rewriteJS(js);
    const newResponse = new Response(rewrittenJs, {
      status: response.status,
      headers: response.headers,
    });
    await putResponse(newRequest, newResponse);
    return newResponse;
  } else if (contentType && contentType.includes('text/css')) {
    const css = await response.text();
    const rewriter = new CSSRewriter();
    const rewrittenCss = rewriter.rewriteCSS(css);
    const newResponse = new Response(rewrittenCss, {
      status: response.status,
      headers: response.headers,
    });
    await putResponse(newRequest, newResponse);
    return newResponse;
  } else {
    await putResponse(newRequest, response);
    return response;
  }
}