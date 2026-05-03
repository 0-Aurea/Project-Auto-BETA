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
    const code = match.slice(5, -1);
    return this.rewriteJS(code);
  }

  rewriteFunction(match) {
    const args = match.slice(9, -1);
    const code = args.split('),').pop();
    return `${args}, ${this.rewriteJS(code)}`;
  }

  rewriteDynamicImport(match) {
    return this.rewriteURL(match.slice(7, -1));
  }

  rewriteRequire(match) {
    return this.rewriteURL(match.slice(8, -1));
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }

  rewriteHistoryPushState() {
    return `null, null, '${this.rewriteURL(window.location.href)}'`;
  }

  rewriteHistoryReplaceState() {
    return `null, null, '${this.rewriteURL(window.location.href)}'`;
  }
}

class WebSocketRewriter {
  constructor() {
    this.websocketRegex = /wss?:\/\/[^)]+/g;
  }

  rewriteWebSocket(ws) {
    return ws.replace(this.websocketRegex, (match) => {
      const salt = rotatingSalt[rotatingSalt.length - 1];
      return xorBase64Encode(match, salt);
    });
  }
}

addEventListener('fetch', async (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const salt = rotatingSalt[rotatingSalt.length - 1];

  if (request.method === 'GET') {
    const response = await getResponse(request);
    if (response) {
      return response;
    }
  }

  const response = await fetch(request);
  const contentType = response.headers.get('content-type');

  if (contentType && contentType.includes('application/javascript')) {
    const jsRewriter = new JSRewriter();
    const js = await response.text();
    const rewrittenJs = jsRewriter.rewriteJS(js);
    return new Response(rewrittenJs, {
      headers: {
        'content-type': 'application/javascript',
      },
    });
  }

  if (contentType && contentType.includes('text/html')) {
    const htmlRewriter = new HTMLRewriter();
    const html = await response.text();
    const rewrittenHtml = htmlRewriter.rewriteHTML(html);
    return new Response(rewrittenHtml, {
      headers: {
        'content-type': 'text/html',
      },
    });
  }

  if (request.method === 'WebSocket') {
    const wsRewriter = new WebSocketRewriter();
    const ws = await response.body;
    const rewrittenWs = wsRewriter.rewriteWebSocket(ws);
    return new Response(rewrittenWs, {
      headers: {
        'content-type': 'application/websocket',
      },
    });
  }

  return response;
}

class HTMLRewriter {
  constructor() {
    this.srcRegex = /src=['"]([^'"]+)['"]/g;
    this.hrefRegex = /href=['"]([^'"]+)['"]/g;
  }

  rewriteHTML(html) {
    html = html.replace(this.srcRegex, (match, p1) => {
      return `src='${this.rewriteURL(p1)}'`;
    });

    html = html.replace(this.hrefRegex, (match, p1) => {
      return `href='${this.rewriteURL(p1)}'`;
    });

    return html;
  }

  rewriteURL(url) {
    const salt = rotatingSalt[rotatingSalt.length - 1];
    return xorBase64Encode(url, salt);
  }
}