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
  const proxiedResponse = new Response(response.body, response);
  proxiedResponse.headers.set('Content-Type', 'text/html; charset=utf-8');
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