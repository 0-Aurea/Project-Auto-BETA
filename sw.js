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
      return `import(${this.rewriteURL(p1)})`;
    });

    js = js.replace(this.workerRegex, (match, p1) => {
      return `new Worker(${this.rewriteURL(p1)})`;
    });

    js = js.replace(this.importScriptsRegex, (match, p1) => {
      return `importScripts(${this.rewriteURL(p1)})`;
    });

    js = js.replace(this.documentDomainRegex, (match, p1) => {
      return `document.domain = ${this.rewriteURL(p1)}`;
    });

    js = js.replace(this.windowLocationRegex, (match, p1) => {
      return `window.location = ${this.rewriteURL(p1)}`;
    });

    js = js.replace(this.windowOpenRegex, (match, p1) => {
      return `window.open(${this.rewriteURL(p1)})`;
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
    return this.xorBase64Encode(evalStr, generateSalt());
  }

  rewriteFunction(funcStr) {
    return this.xorBase64Encode(funcStr, generateSalt());
  }

  rewriteDynamicImport(importStr) {
    return this.rewriteURL(importStr);
  }

  rewriteRequire(requireStr) {
    return this.rewriteURL(requireStr);
  }

  rewriteURL(url) {
    return xorBase64Encode(url, generateSalt());
  }

  rewriteHistoryState(stateStr) {
    return stateStr;
  }

  xorBase64Encode(data, salt) {
    return xorBase64Encode(data, salt);
  }
}

async function handleFetch(request) {
  const rewriter = new JSRewriter();
  const response = await getResponse(request);
  if (response) {
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/javascript')) {
      const js = await response.text();
      const rewrittenJs = rewriter.rewriteJS(js);
      const rewrittenResponse = new Response(rewrittenJs, {
        headers: {
          'Content-Type': contentType,
        },
      });
      return rewrittenResponse;
    } else {
      return response;
    }
  } else {
    return new Response('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}