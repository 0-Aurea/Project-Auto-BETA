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
  } else if (event.data.type === 'update-tab') {
    updateTab(event.data.tabId, event.data.url);
  } else if (event.data.type === 'close-tab') {
    closeTab(event.data.tabId);
  } else if (event.data.type === 'search') {
    search(event.data.query, event.data.engine);
  }
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const cacheName = 'nexus-cache';
const cacheVersion = 'v1';
const rotatingSalt = [];
let cache;
let tabs = {};

// Cache API functions
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

// Salt and encoding functions
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

// JS Rewriter class
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

  rewriteEval(match) {
    return match.slice(5, -1);
  }

  rewriteFunction(match) {
    return match.slice(9, -1);
  }

  rewriteDynamicImport(match) {
    return match;
  }

  rewriteRequire(match) {
    return match.slice(8, -1);
  }

  rewriteURL(url) {
    return url;
  }

  rewriteHistoryState(match) {
    return match;
  }
}

// HTML Rewriter class
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
    return url;
  }
}

// CSS Rewriter class
class CSSRewriter {
  constructor() {
    this.urlRegex = /url\(['"]([^'"]+)['"]\)/g;
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
    return url;
  }
}

async function handleFetch(request) {
  const url = new URL(request.url);
  const isProxyRequest = url.pathname.startsWith('/proxy/');

  if (isProxyRequest) {
    const proxiedRequest = await handleProxiedRequest(request);
    return proxiedRequest;
  }

  const response = await getResponse(request);
  if (response) {
    return response;
  }

  try {
    const fetchResponse = await fetch(request);
    await putResponse(request, fetchResponse.clone());
    return fetchResponse;
  } catch (error) {
    console.error('Error handling fetch:', error);
    return new Response('Error handling fetch', { status: 500 });
  }
}

async function handleProxiedRequest(request) {
  const url = new URL(request.url);
  const proxiedURL = url.pathname.slice(7);

  const proxiedRequest = new Request(proxiedURL, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });

  try {
    const response = await fetch(proxiedRequest);
    const rewrittenResponse = await rewriteResponse(response);
    return rewrittenResponse;
  } catch (error) {
    console.error('Error handling proxied request:', error);
    return new Response('Error handling proxied request', { status: 500 });
  }
}

async function rewriteResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/html')) {
    const html = await response.text();
    const rewriter = new HTMLRewriter();
    const rewrittenHTML = rewriter.rewriteHTML(html);
    return new Response(rewrittenHTML, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('application/javascript')) {
    const js = await response.text();
    const rewriter = new JSRewriter();
    const rewrittenJS = rewriter.rewriteJS(js);
    return new Response(rewrittenJS, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('text/css')) {
    const css = await response.text();
    const rewriter = new CSSRewriter();
    const rewrittenCSS = rewriter.rewriteCSS(css);
    return new Response(rewrittenCSS, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}

function updateTab(tabId, url) {
  tabs[tabId] = url;
}

function closeTab(tabId) {
  delete tabs[tabId];
}

function search(query, engine) {
  // Implement search functionality
}

generateSalt();