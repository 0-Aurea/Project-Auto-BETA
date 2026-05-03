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
      return `history.pushState(${this.rewriteHistoryState(match)})`;
    });

    js = js.replace(this.historyReplaceStateRegex, (match) => {
      return `history.replaceState(${this.rewriteHistoryState(match)})`;
    });

    return js;
  }

  rewriteEval(evalStr) {
    return this.rewriteCode(evalStr.slice(5, -1));
  }

  rewriteFunction(funcStr) {
    const funcArgs = funcStr.slice(9, -1).split(',').map(arg => arg.trim());
    const funcBody = funcArgs.pop();
    return `${funcArgs.join(', ')}, ${this.rewriteCode(funcBody)}`;
  }

  rewriteDynamicImport(importStr) {
    return this.rewriteURL(importStr.slice(7, -1));
  }

  rewriteRequire(requireStr) {
    return this.rewriteURL(requireStr.slice(8, -1));
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }

  rewriteCode(code) {
    return code.replace(/['"]?(\/[^'"]+)['"]?/g, (match, p1) => {
      return `'${this.rewriteURL(p1)}'`;
    });
  }

  rewriteHistoryState(stateStr) {
    return stateStr.replace(/['"]?(\/[^'"]+)['"]?/g, (match, p1) => {
      return `'${this.rewriteURL(p1)}'`;
    });
  }
}

const jsRewriter = new JSRewriter();

self.addEventListener('fetch', async (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const cache = await getCache();
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    const responseClone = response.clone();
    const js = await responseClone.text();
    const rewrittenJs = jsRewriter.rewriteJS(js);
    const rewrittenResponse = new Response(rewrittenJs, responseClone);
    await putResponse(request, rewrittenResponse);
    return rewrittenResponse;
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response('Error handling request', { status: 500 });
  }
}

self.addEventListener('activate', async (event) => {
  event.waitUntil(getCache().then(cache => cache.keys().then(requests => Promise.all(requests.map(request => cache.delete(request)))));
});

self.addEventListener('install', async (event) => {
  event.waitUntil(getCache());
});