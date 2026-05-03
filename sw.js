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
    js = js.replace(this.scriptRegex, (match, p1) => {
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
      return `document.domain = '${p1}'`;
    });

    js = js.replace(this.windowLocationRegex, (match, p1) => {
      return `window.location = '${this.rewriteURL(p1)}'`;
    });

    js = js.replace(this.windowOpenRegex, (match, p1) => {
      return `window.open('${this.rewriteURL(p1)}')`;
    });

    js = js.replace(this.historyPushStateRegex, (match) => {
      return `history.pushState(${this.rewriteHistory(match)})`;
    });

    js = js.replace(this.historyReplaceStateRegex, (match) => {
      return `history.replaceState(${this.rewriteHistory(match)})`;
    });

    return js;
  }

  rewriteEval(evalStr) {
    return evalStr.replace(/\(/g, '(__nexus_eval__(');
  }

  rewriteFunction(funcStr) {
    return funcStr.replace(/\(/g, '(__nexus_function__(');
  }

  rewriteDynamicImport(importStr) {
    return importStr;
  }

  rewriteRequire(requireStr) {
    return requireStr;
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }

  rewriteHistory(historyStr) {
    return historyStr;
  }
}

const jsRewriter = new JSRewriter();

async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/nexus/')) {
    return handleNexusRequest(request);
  }
  const salt = rotatingSalt[rotatingSalt.length - 1];
  if (!salt) {
    generateSalt();
  }
  const encodedUrl = xorBase64Encode(url.href, salt);
  const proxiedRequest = new Request(`https://localhost:${PORT}/proxy/${encodedUrl}`, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  const response = await fetch(proxiedRequest);
  let proxiedResponse;
  if (response.headers.get('Content-Type').includes('text/html')) {
    let html = await response.text();
    html = html.replace(/<script>/g, '<script>__nexus_js_rewriter__ = true;');
    html = html.replace(/<\/head>/g, () => {
      return `
        <script>
          __nexus_js_rewriter__ = true;
          function __nexus_rewrite_js__(js) {
            return ${jsRewriter.rewriteJS('js')};
          }
        </script>
      </head>
    `;
    });
    proxiedResponse = new Response(html, response);
  } else if (response.headers.get('Content-Type').includes('application/javascript')) {
    let js = await response.text();
    js = jsRewriter.rewriteJS(js);
    proxiedResponse = new Response(js, response);
  } else {
    proxiedResponse = new Response(response.body, response);
  }
  proxiedResponse.headers.set('Content-Type', proxiedResponse.headers.get('Content-Type'));
  await putResponse(request, proxiedResponse);
  return proxiedResponse;
}

async function handleNexusRequest(request) {
  const url = new URL(request.url);
  if (url.pathname === '/nexus/ping') {
    return new Response('pong');
  }
  if (url.pathname === '/nexus/config') {
    return new Response(JSON.stringify({
      version: cacheVersion,
      salt: rotatingSalt,
    }));
  }
}

async function handleFetchEvent(event) {
  event.respondWith(handleRequest(event.request));
}

self.addEventListener('fetch', handleFetchEvent);

self.addEventListener('activate', async event => {
  event.waitUntil(getCache().then(cache => cache.keys()).then(requests => {
    for (const request of requests) {
      if (request.url.pathname.startsWith('/nexus/')) {
        return cache.delete(request);
      }
    }
  }));
});

self.addEventListener('install', async event => {
  event.waitUntil(getCache());
});