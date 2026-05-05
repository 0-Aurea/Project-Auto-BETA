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
      return `import(${this.rewriteDynamicImport(p1)})`;
    });

    js = js.replace(this.workerRegex, (match, p1) => {
      return `new Worker(${this.rewriteWorker(p1)})`;
    });

    js = js.replace(this.importScriptsRegex, (match, p1) => {
      return `importScripts(${this.rewriteImportScripts(p1)})`;
    });

    js = js.replace(this.documentDomainRegex, (match, p1) => {
      return `document.domain = ${this.rewriteDocumentDomain(p1)}`;
    });

    js = js.replace(this.windowLocationRegex, (match, p1) => {
      return `window.location = ${this.rewriteWindowLocation(p1)}`;
    });

    js = js.replace(this.windowOpenRegex, (match, p1) => {
      return `window.open(${this.rewriteWindowOpen(p1)})`;
    });

    js = js.replace(this.historyPushStateRegex, (match) => {
      return `history.pushState(${this.rewriteHistoryPushState(match)})`;
    });

    js = js.replace(this.historyReplaceStateRegex, (match) => {
      return `history.replaceState(${this.rewriteHistoryReplaceState(match)})`;
    });

    return js;
  }

  rewriteEval(evalStr) {
    return evalStr.replace(/[^a-zA-Z0-9]/g, '');
  }

  rewriteFunction(funcStr) {
    return funcStr.replace(/[^a-zA-Z0-9]/g, '');
  }

  rewriteDynamicImport(importStr) {
    return this.xorBase64Encode(importStr, generateSalt());
  }

  rewriteRequire(requireStr) {
    return this.xorBase64Encode(requireStr, generateSalt());
  }

  rewriteWorker(workerStr) {
    return this.xorBase64Encode(workerStr, generateSalt());
  }

  rewriteImportScripts(importScriptsStr) {
    return this.xorBase64Encode(importScriptsStr, generateSalt());
  }

  rewriteDocumentDomain(domain) {
    return domain;
  }

  rewriteWindowLocation(location) {
    return location;
  }

  rewriteWindowOpen(openStr) {
    return openStr;
  }

  rewriteHistoryPushState(pushStateStr) {
    return pushStateStr;
  }

  rewriteHistoryReplaceState(replaceStateStr) {
    return replaceStateStr;
  }

  xorBase64Encode(data, salt) {
    return xorBase64Encode(data, salt);
  }
}

// HTML Rewriter class
class HTMLRewriter {
  constructor() {
    this.srcRegex = /src=['"]([^'"]+)['"]/g;
    this.hrefRegex = /href=['"]([^'"]+)['"]/g;
    this.actionRegex = /action=['"]([^'"]+)['"]/g;
    this.srcsetRegex = /srcset=['"]([^'"]+)['"]/g;
    this.dataRegex = /data-([a-zA-Z0-9-]+)=['"]([^'"]+)['"]/g;
  }

  rewriteHTML(html) {
    html = html.replace(this.srcRegex, (match, p1) => {
      return `src=${this.rewriteSrc(p1)}`;
    });

    html = html.replace(this.hrefRegex, (match, p1) => {
      return `href=${this.rewriteHref(p1)}`;
    });

    html = html.replace(this.actionRegex, (match, p1) => {
      return `action=${this.rewriteAction(p1)}`;
    });

    html = html.replace(this.srcsetRegex, (match, p1) => {
      return `srcset=${this.rewriteSrcset(p1)}`;
    });

    html = html.replace(this.dataRegex, (match, p1, p2) => {
      return `data-${p1}=${this.rewriteData(p2)}`;
    });

    return html;
  }

  rewriteSrc(src) {
    return this.xorBase64Encode(src, generateSalt());
  }

  rewriteHref(href) {
    return this.xorBase64Encode(href, generateSalt());
  }

  rewriteAction(action) {
    return this.xorBase64Encode(action, generateSalt());
  }

  rewriteSrcset(srcset) {
    return this.xorBase64Encode(srcset, generateSalt());
  }

  rewriteData(data) {
    return this.xorBase64Encode(data, generateSalt());
  }

  xorBase64Encode(data, salt) {
    return xorBase64Encode(data, salt);
  }
}

// CSS Rewriter class
class CSSRewriter {
  constructor() {
    this.urlRegex = /url\(['"]([^'"]+)['"]\)/g;
    this.importRegex = /@import\s+['"]([^'"]+)['"]/g;
    this.contentRegex = /content:\s*url\(['"]([^'"]+)['"]\)/g;
  }

  rewriteCSS(css) {
    css = css.replace(this.urlRegex, (match, p1) => {
      return `url(${this.rewriteURL(p1)})`;
    });

    css = css.replace(this.importRegex, (match, p1) => {
      return `@import ${this.rewriteImport(p1)}`;
    });

    css = css.replace(this.contentRegex, (match, p1) => {
      return `content: url(${this.rewriteContent(p1)})`;
    });

    return css;
  }

  rewriteURL(url) {
    return this.xorBase64Encode(url, generateSalt());
  }

  rewriteImport(importStr) {
    return this.xorBase64Encode(importStr, generateSalt());
  }

  rewriteContent(content) {
    return this.xorBase64Encode(content, generateSalt());
  }

  xorBase64Encode(data, salt) {
    return xorBase64Encode(data, salt);
  }
}

// handleFetch function
async function handleFetch(request) {
  const url = new URL(request.url);
  const cache = await getCache();
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    const clonedResponse = response.clone();

    if (response.ok) {
      const responseBody = await response.text();
      const rewrittenResponseBody = rewriteResponseBody(responseBody, request);
      const rewrittenResponse = new Response(rewrittenResponseBody, response);

      await putResponse(request, rewrittenResponse);

      return rewrittenResponse;
    } else {
      return response;
    }
  } catch (error) {
    console.error('Error handling fetch:', error);
    return new Response('Error handling fetch', { status: 500 });
  }
}

// rewriteResponseBody function
function rewriteResponseBody(responseBody, request) {
  const contentType = request.headers.get('Content-Type');

  if (contentType && contentType.includes('text/html')) {
    const htmlRewriter = new HTMLRewriter();
    return htmlRewriter.rewriteHTML(responseBody);
  } else if (contentType && contentType.includes('application/javascript')) {
    const jsRewriter = new JSRewriter();
    return jsRewriter.rewriteJS(responseBody);
  } else if (contentType && contentType.includes('text/css')) {
    const cssRewriter = new CSSRewriter();
    return cssRewriter.rewriteCSS(responseBody);
  }

  return responseBody;
}

// updateTab function
function updateTab(tabId, url) {
  tabs[tabId] = url;
}

// closeTab function
function closeTab(tabId) {
  delete tabs[tabId];
}

// search function
function search(query, engine) {
  // TO DO: implement search functionality
}

// Generate a random salt and encode the request URL
function encodeRequestURL(requestURL) {
  const salt = generateSalt();
  return xorBase64Encode(requestURL, salt);
}

// Decode the response URL
function decodeResponseURL(encodedURL, salt) {
  return xorBase64Decode(encodedURL, salt);
}