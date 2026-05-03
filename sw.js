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
    return match;
  }

  rewriteURL(url) {
    return url;
  }

  rewriteHistoryPushState() {
    return '';
  }

  rewriteHistoryReplaceState() {
    return '';
  }
}

class BrotliGzipPipeline {
  constructor() {
    this.brotliDecoder = new BrotliDecoder();
    this.gzipDecoder = new Zlib.Gunzip();
  }

  async decompress(response) {
    const contentEncoding = response.headers.get('content-encoding');
    if (contentEncoding === 'br') {
      return await this.brotliDecompress(response);
    } else if (contentEncoding === 'gzip') {
      return await this.gzipDecompress(response);
    }
    return response;
  }

  async brotliDecompress(response) {
    const arrayBuffer = await response.arrayBuffer();
    const decompressedArrayBuffer = await this.brotliDecoder.decode(arrayBuffer);
    return new Response(decompressedArrayBuffer, {
      headers: response.headers,
    });
  }

  async gzipDecompress(response) {
    const arrayBuffer = await response.arrayBuffer();
    const decompressedArrayBuffer = await this.gzipDecoder.decode(arrayBuffer);
    return new Response(decompressedArrayBuffer, {
      headers: response.headers,
    });
  }

  async reCompress(response) {
    const contentEncoding = response.headers.get('content-encoding');
    if (contentEncoding === 'br') {
      return await this.brotliRecompress(response);
    } else if (contentEncoding === 'gzip') {
      return await this.gzipRecompress(response);
    }
    return response;
  }

  async brotliRecompress(response) {
    const arrayBuffer = await response.arrayBuffer();
    const compressedArrayBuffer = await this.brotliEncoder.encode(arrayBuffer);
    return new Response(compressedArrayBuffer, {
      headers: response.headers,
    });
  }

  async gzipRecompress(response) {
    const arrayBuffer = await response.arrayBuffer();
    const compressedArrayBuffer = await this.gzipEncoder.encode(arrayBuffer);
    return new Response(compressedArrayBuffer, {
      headers: response.headers,
    });
  }
}

addEventListener('fetch', async (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const cache = await getCache();
  const response = await cache.match(request);
  if (response) {
    return response;
  }

  const proxiedResponse = await fetch(request);
  const decompressedResponse = await new BrotliGzipPipeline().decompress(proxiedResponse);
  const recompressedResponse = await new BrotliGzipPipeline().reCompress(decompressedResponse);

  await cache.put(request, recompressedResponse.clone());
  return recompressedResponse;
}

class BrotliDecoder {
  async decode(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const decompressed = brotliDecompressSync(arrayBuffer);
      resolve(decompressed);
    });
  }
}

function brotliDecompressSync(arrayBuffer) {
  // brotli decompression implementation
  // This implementation uses the pako library
  const pako = require('pako');
  return pako.inflate(arrayBuffer, { to: 'Uint8Array' });
}

class Zlib {
  static Gunzip() {
    return new Zlib.GunzipClass();
  }

  static async gunzip(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const zlib = require('zlib');
      zlib.gunzip(arrayBuffer, (err, decompressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(decompressed);
        }
      });
    });
  }
}

class ZlibGunzipClass {
  async decode(arrayBuffer) {
    return Zlib.gunzip(arrayBuffer);
  }
}

const brotliEncoder = new BrotliEncoder();

class BrotliEncoder {
  async encode(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const compressed = brotliCompressSync(arrayBuffer);
      resolve(compressed);
    });
  }
}

function brotliCompressSync(arrayBuffer) {
  // brotli compression implementation
  // This implementation uses the pako library
  const pako = require('pako');
  return pako.deflate(arrayBuffer, { to: 'Uint8Array' });
}

const gzipEncoder = new GzipEncoder();

class GzipEncoder {
  async encode(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const zlib = require('zlib');
      zlib.gzip(arrayBuffer, (err, compressed) => {
        if (err) {
          reject(err);
        } else {
          resolve(compressed);
        }
      });
    });
  }
}