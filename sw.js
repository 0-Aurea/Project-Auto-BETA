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

    js = js.replace(this.historyPushStateRegex, () => {
      return `history.pushState(${this.rewriteHistoryPushState()})`;
    });

    js = js.replace(this.historyReplaceStateRegex, () => {
      return `history.replaceState(${this.rewriteHistoryReplaceState()})`;
    });

    return js;
  }

  rewriteEval(evalString) {
    try {
      const evalFunc = new Function(`return ${evalString}`);
      const result = evalFunc();
      return result;
    } catch (e) {
      return evalString;
    }
  }

  rewriteFunction(functionString) {
    try {
      const func = new Function(`return ${functionString}`);
      const result = func();
      return result;
    } catch (e) {
      return functionString;
    }
  }

  rewriteDynamicImport(importString) {
    return this.rewriteURL(importString);
  }

  rewriteRequire(requireString) {
    return this.rewriteURL(requireString);
  }

  rewriteURL(url) {
    if (url.startsWith('http')) {
      return url;
    } else {
      return xorBase64Encode(url, generateSalt());
    }
  }

  rewriteHistoryPushState() {
    return `null, null, '${this.rewriteURL(window.location.href)}'`;
  }

  rewriteHistoryReplaceState() {
    return `null, null, '${this.rewriteURL(window.location.href)}'`;
  }
}

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
      return `src='${this.rewriteURL(p1)}'`;
    });

    html = html.replace(this.hrefRegex, (match, p1) => {
      return `href='${this.rewriteURL(p1)}'`;
    });

    html = html.replace(this.actionRegex, (match, p1) => {
      return `action='${this.rewriteURL(p1)}'`;
    });

    html = html.replace(this.srcsetRegex, (match, p1) => {
      return `srcset='${this.rewriteURL(p1)}'`;
    });

    html = html.replace(this.dataRegex, (match, p1, p2) => {
      return `data-${p1}='${this.rewriteURL(p2)}'`;
    });

    return html;
  }

  rewriteURL(url) {
    if (url.startsWith('http')) {
      return url;
    } else {
      return xorBase64Encode(url, generateSalt());
    }
  }
}

class CSSRewriter {
  constructor() {
    this.urlRegex = /url\(['"]([^'"]+)['"]\)/g;
    this.importRegex = /@import\s+['"]([^'"]+)['"]/g;
    this.contentRegex = /content:\s*url\(['"]([^'"]+)['"]\)/g;
  }

  rewriteCSS(css) {
    css = css.replace(this.urlRegex, (match, p1) => {
      return `url('${this.rewriteURL(p1)}')`;
    });

    css = css.replace(this.importRegex, (match, p1) => {
      return `@import '${this.rewriteURL(p1)}'`;
    });

    css = css.replace(this.contentRegex, (match, p1) => {
      return `content: url('${this.rewriteURL(p1)}')`;
    });

    return css;
  }

  rewriteURL(url) {
    if (url.startsWith('http')) {
      return url;
    } else {
      return xorBase64Encode(url, generateSalt());
    }
  }
}

addEventListener('fetch', async (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
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
      const ttlHeader = response.headers.get('ttl');
      const ttl = ttlHeader ? parseInt(ttlHeader) : 60; // default to 1 minute
      const cacheResponse = new Response(clonedResponse.body, {
        status: response.status,
        headers: response.headers,
      });

      await putResponse(request, cacheResponse);

      setTimeout(async () => {
        await deleteResponse(request);
      }, ttl * 1000);

      return response;
    } else {
      return response;
    }
  } catch (e) {
    console.error(e);
    return new Response('Error', { status: 500 });
  }
}

addEventListener('activate', async (event) => {
  event.waitUntil(caches.keys().then((cacheNames) => {
    return Promise.all(cacheNames.map((cacheName) => {
      if (cacheName !== cacheName) {
        return caches.delete(cacheName);
      }
    }));
  }));
});

addEventListener('message', async (event) => {
  if (event.data.type === 'generateSalt') {
    generateSalt();
  }
});
self.tf = tf;