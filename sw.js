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

  rewriteEval(match) {
    return match.slice(5, -1);
  }

  rewriteFunction(match) {
    return match.slice(9, -1);
  }

  rewriteDynamicImport(match) {
    return match.slice(7, -1);
  }

  rewriteRequire(match) {
    return match.slice(8, -1);
  }

  rewriteURL(url) {
    return url;
  }

  rewriteHistoryState(match) {
    return match;
  }
}

class WebSocketProxy {
  constructor() {
    this.websockets = new Map();
  }

  handleWebSocket(request) {
    const url = new URL(request.url);
    const websocketUrl = url.protocol === 'wss:' ? 'wss' : 'ws';
    const targetUrl = `${websocketUrl}://${url.host}${url.pathname}`;

    const websocket = new WebSocket(targetUrl);

    this.websockets.set(request, websocket);

    websocket.onmessage = (event) => {
      request.respondWith(new Response(event.data));
    };

    websocket.onclose = () => {
      this.websockets.delete(request);
    };

    websocket.onerror = (event) => {
      console.error('WebSocket error:', event);
    };

    return new Promise((resolve) => {
      websocket.onopen = () => {
        resolve();
      };
    });
  }
}

class WebRTCProxy {
  constructor() {
    this.rtcPeerConnections = new Map();
  }

  handleWebRTC(request) {
    const rtcPeerConnection = new RTCPeerConnection();

    this.rtcPeerConnections.set(request, rtcPeerConnection);

    rtcPeerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        const candidate = event.candidate;
        candidate.sdpMLN = '';
        candidate.sdpMid = '';
        request.respondWith(new Response(JSON.stringify(candidate)));
      }
    };

    rtcPeerConnection.onaddstream = (event) => {
      console.log('WebRTC stream added:', event.stream);
    };

    rtcPeerConnection.onremovestream = (event) => {
      console.log('WebRTC stream removed:', event.stream);
    };

    return new Promise((resolve) => {
      rtcPeerConnection.oncreateoffer = (offer) => {
        resolve(offer);
      };
    });
  }
}

const webSocketProxy = new WebSocketProxy();
const webRTCProxy = new WebRTCProxy();

self.addEventListener('fetch', async (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/') {
    event.respondWith(handleRequest(request));
  } else if (request.method === 'GET' && url.pathname === '/ws') {
    event.respondWith(webSocketProxy.handleWebSocket(request));
  } else if (request.method === 'GET' && url.pathname === '/webrtc') {
    event.respondWith(webRTCProxy.handleWebRTC(request));
  } else {
    event.respondWith(handleRequest(request));
  }
});

async function handleRequest(request) {
  const cache = await getCache();
  const response = await cache.match(request);

  if (response) {
    return response;
  }

  try {
    const newResponse = await fetch(request);
    await putResponse(request, newResponse.clone());
    return newResponse;
  } catch (error) {
    console.error('Error handling request:', error);
    return new Response('Error handling request', { status: 500 });
  }
}

self.addEventListener('message', async (event) => {
  if (event.data.type === 'ping') {
    event.ports[0].postMessage('pong');
  }
});

self.addEventListener('activate', async (event) => {
  event.waitUntil(getCache());
});

self.addEventListener('install', async (event) => {
  event.waitUntil(getCache());
});