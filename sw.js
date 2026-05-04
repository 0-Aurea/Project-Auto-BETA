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
      return `import(${this.rewriteDynamicImportPath(p1)})`;
    });

    js = js.replace(this.workerRegex, (match, p1) => {
      return `new Worker(${this.rewriteWorkerPath(p1)})`;
    });

    js = js.replace(this.importScriptsRegex, (match, p1) => {
      return `importScripts(${this.rewriteImportScriptsPath(p1)})`;
    });

    js = js.replace(this.documentDomainRegex, (match, p1) => {
      return `document.domain = ${this.rewriteDomain(p1)}`;
    });

    js = js.replace(this.windowLocationRegex, (match, p1) => {
      return `window.location = ${this.rewriteLocation(p1)}`;
    });

    js = js.replace(this.windowOpenRegex, (match, p1) => {
      return `window.open(${this.rewriteOpen(p1)})`;
    });

    js = js.replace(this.historyPushStateRegex, (match) => {
      return `${match} /* rewritten */`;
    });

    js = js.replace(this.historyReplaceStateRegex, (match) => {
      return `${match} /* rewritten */`;
    });

    return js;
  }

  rewriteEval(evalStr) {
    return this.xorBase64Encode(evalStr, generateSalt());
  }

  rewriteFunction(funcStr) {
    return this.xorBase64Encode(funcStr, generateSalt());
  }

  rewriteDynamicImportPath(importPath) {
    return this.xorBase64Encode(importPath, generateSalt());
  }

  rewriteRequire(requireStr) {
    return this.xorBase64Encode(requireStr, generateSalt());
  }

  rewriteWorkerPath(workerPath) {
    return this.xorBase64Encode(workerPath, generateSalt());
  }

  rewriteImportScriptsPath(importScriptsPath) {
    return this.xorBase64Encode(importScriptsPath, generateSalt());
  }

  rewriteDomain(domain) {
    return this.xorBase64Encode(domain, generateSalt());
  }

  rewriteLocation(location) {
    return this.xorBase64Encode(location, generateSalt());
  }

  rewriteOpen(openStr) {
    return this.xorBase64Encode(openStr, generateSalt());
  }

  xorBase64Encode(data, salt) {
    return xorBase64Encode(data, salt);
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
      return `src="${this.rewriteSrc(p1)}"`;
    });

    html = html.replace(this.hrefRegex, (match, p1) => {
      return `href="${this.rewriteHref(p1)}"`;
    });

    html = html.replace(this.actionRegex, (match, p1) => {
      return `action="${this.rewriteAction(p1)}"`;
    });

    html = html.replace(this.srcsetRegex, (match, p1) => {
      return `srcset="${this.rewriteSrcset(p1)}"`;
    });

    html = html.replace(this.dataRegex, (match, p1) => {
      return `data="${this.rewriteData(p1)}"`;
    });

    return html;
  }

  rewriteSrc(src) {
    return xorBase64Encode(src, generateSalt());
  }

  rewriteHref(href) {
    return xorBase64Encode(href, generateSalt());
  }

  rewriteAction(action) {
    return xorBase64Encode(action, generateSalt());
  }

  rewriteSrcset(srcset) {
    return xorBase64Encode(srcset, generateSalt());
  }

  rewriteData(data) {
    return xorBase64Encode(data, generateSalt());
  }
}

class WebSocketRewriter {
  constructor() {}

  rewriteWebSocket(ws) {
    ws.on('message', (event) => {
      event.data = xorBase64Encode(event.data, generateSalt());
    });

    ws.on('open', () => {
      console.log('WebSocket connection established');
    });

    ws.on('error', (error) => {
      console.log('WebSocket error:', error);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  }
}

async function handleFetch(request) {
  const url = new URL(request.url);
  const cache = await getCache();

  if (request.method === 'GET') {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    console.log('Error fetching:', error);
    return new Response('Error fetching', { status: 500 });
  }

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/javascript')) {
    const jsRewriter = new JSRewriter();
    const js = await response.text();
    const rewrittenJs = jsRewriter.rewriteJS(js);
    response = new Response(rewrittenJs, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('text/html')) {
    const htmlRewriter = new HTMLRewriter();
    const html = await response.text();
    const rewrittenHtml = htmlRewriter.rewriteHTML(html);
    response = new Response(rewrittenHtml, {
      status: response.status,
      headers: response.headers,
    });
  }

  if (request.method === 'GET') {
    await cache.put(request, response);
  }

  return response;
}