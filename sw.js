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

async function handleFetch(event) {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === 'GET') {
    const response = await getResponse(request);
    if (response) {
      event.respondWith(response);
      return;
    }
  }

  const newRequest = new Request(request);
  newRequest.headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.3');

  fetch(newRequest)
    .then(response => {
      if (response.ok) {
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('Cache-Control', 'max-age=3600');
        putResponse(request, newResponse);
        event.respondWith(newResponse);
      } else {
        event.respondWith(response);
      }
    })
    .catch(error => {
      event.respondWith(new Response('Error: ' + error, { status: 500 }));
    });
}

async function handleCache(event) {
  const request = event.request;
  const cache = await getCache();
  const response = await cache.match(request);
  if (response) {
    event.respondWith(response);
  }
}

self.addEventListener('fetch', handleFetch);
self.addEventListener('cache', handleCache);

self.addEventListener('activate', async event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== cacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('install', async event => {
  event.waitUntil(
    getCache().then(cache => {
      return cache.addAll([]);
    })
  );
});

function decompressGzip(data) {
  const decompressedData = [];
  const gzipHeader = data.slice(0, 10);
  const compressedData = data.slice(10);
  const inflater = new zlib.Inflate(compressedData);
  const decompressedArray = inflater.decompress();
  return String.fromCharCode(...decompressedArray);
}

function decompressBrotli(data) {
  const decompressedData = [];
  const brotliDecoder = new brotli.Decoder();
  const decompressedArray = brotliDecoder.decode(data);
  return String.fromCharCode(...decompressedArray);
}

function compressGzip(data) {
  const compressedData = [];
  const gzipHeader = [0x1f, 0x8b];
  const deflater = new zlib.Deflate();
  const compressedArray = deflater.compress(data);
  return new Uint8Array([...gzipHeader, ...compressedArray]);
}

function compressBrotli(data) {
  const compressedData = [];
  const brotliEncoder = new brotli.Encoder();
  const compressedArray = brotliEncoder.encode(data);
  return new Uint8Array(compressedArray);
}

async function handleResponse(response) {
  const contentEncoding = response.headers.get('content-encoding');
  if (contentEncoding === 'gzip') {
    const decompressedData = decompressGzip(await response.arrayBuffer());
    const newResponse = new Response(decompressedData, response);
    return newResponse;
  } else if (contentEncoding === 'br') {
    const decompressedData = decompressBrotli(await response.arrayBuffer());
    const newResponse = new Response(decompressedData, response);
    return newResponse;
  } else {
    return response;
  }
}