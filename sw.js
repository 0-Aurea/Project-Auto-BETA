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
    const salt = generateSalt();
    return xorBase64Encode(url, salt);
  }
}

class GzipDecompressor {
  async decompress(response) {
    if (response.headers.get('content-encoding') === 'gzip') {
      const decompressedBody = await this.decompressGzip(response.body);
      return new Response(decompressedBody, {
        headers: response.headers,
        status: response.status,
      });
    }
    return response;
  }

  async decompressGzip(body) {
    const reader = body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
    }
    const gzipData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0));
    let offset = 0;
    for (const chunk of chunks) {
      gzipData.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    const decompressedData = pako.ungzip(gzipData, { to: 'string' });
    return encoder.encode(decompressedData);
  }
}

class BrotliDecompressor {
  async decompress(response) {
    if (response.headers.get('content-encoding') === 'br') {
      const decompressedBody = await this.decompressBrotli(response.body);
      return new Response(decompressedBody, {
        headers: response.headers,
        status: response.status,
      });
    }
    return response;
  }

  async decompressBrotli(body) {
    const reader = body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
    }
    const brotliData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0));
    let offset = 0;
    for (const chunk of chunks) {
      brotliData.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    const decompressedData = brotliDecompress(brotliData);
    return encoder.encode(decompressedData);
  }
}

function brotliDecompress(data) {
  return new Promise((resolve, reject) => {
    brotliDecompressor.decompress(data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

const brotliDecompressor = new BrotliDecoder();

async function handleFetch(request) {
  const decompressor = new GzipDecompressor();
  const brotliDecompressor = new BrotliDecompressor();
  let response = await getResponse(request);
  if (!response) {
    response = await fetch(request);
    response = await decompressor.decompress(response);
    response = await brotliDecompressor.decompress(response);
    await putResponse(request, response.clone());
  }
  return response;
}

importScripts('https://cdn.jsdelivr.net/npm/pako@1.0.10/dist/pako.min.js');
importScripts('https://cdn.jsdelivr.net/npm/brotli@1.0.1/dist/brotli.min.js');