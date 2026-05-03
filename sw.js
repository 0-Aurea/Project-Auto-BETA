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

  rewriteEval(evalString) {
    try {
      const evalFunc = new Function(`return ${evalString}`);
      const result = evalFunc();
      return xorBase64Encode(result.toString(), generateSalt());
    } catch (e) {
      return evalString;
    }
  }

  rewriteFunction(funcString) {
    try {
      const func = new Function(`return ${funcString}`);
      const funcStringified = func.toString();
      return xorBase64Encode(funcStringified, generateSalt());
    } catch (e) {
      return funcString;
    }
  }

  rewriteDynamicImport(importString) {
    return this.rewriteURL(importString);
  }

  rewriteRequire(requireString) {
    return this.rewriteURL(requireString);
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }

  rewriteHistoryState(state) {
    try {
      const stateObj = JSON.parse(state);
      stateObj.url = this.rewriteURL(stateObj.url);
      return JSON.stringify(stateObj);
    } catch (e) {
      return state;
    }
  }
}

class NexusProxy {
  constructor() {
    this.jsRewriter = new JSRewriter();
  }

  async handleRequest(request) {
    const cache = await getCache();
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const response = await fetch(request);
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/javascript')) {
        const js = await response.text();
        const rewrittenJs = this.jsRewriter.rewriteJS(js);
        const rewrittenResponse = new Response(rewrittenJs, {
          status: response.status,
          headers: response.headers,
        });
        await putResponse(request, rewrittenResponse);
        return rewrittenResponse;
      } else {
        await putResponse(request, response);
        return response;
      }
    } catch (e) {
      return new Response('Error', {
        status: 500,
      });
    }
  }
}

self.addEventListener('fetch', (event) => {
  event.respondWith(new NexusProxy().handleRequest(event.request));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(getCache().then((cache) => cache.keys()).then((keys) => {
    keys.forEach((key) => cache.delete(key));
  }));
});

self.addEventListener('install', (event) => {
  event.waitUntil(getCache());
});