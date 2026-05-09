self.addEventListener('activate', async (event) => {
  event.waitUntil(getCache().then((cache) => cache.keys()).then((keys) => {
    return Promise.all(keys.map((key) => cache.delete(key)));
  }));
});

self.addEventListener('fetch', async (event) => {
  event.respondWith(handleFetch(event.request));
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const cacheName = 'nexus-cache';
const cacheVersion = 'v1';
let cache;

// Cache API functions
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

async function handleFetch(request) {
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/service/') {
        const encodedUrl = url.searchParams.get('url');
        if (encodedUrl) {
          const decodedUrl = decodeURIComponent(encodedUrl);
          const newRequest = new Request(decodedUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });
          const response = await fetch(newRequest);
          const rewrittenResponse = await rewriteResponse(response, decodedUrl);
          return rewrittenResponse;
        }
      }
    }

    const cacheResponse = await getResponse(request);
    if (cacheResponse) {
      return cacheResponse;
    }

    const response = await fetch(request);
    const rewrittenResponse = await rewriteResponse(response, request.url);
    await putResponse(request, rewrittenResponse.clone());
    return rewrittenResponse;
  } catch (error) {
    console.error('Error handling fetch:', error);
    return new Response('Error', { status: 500 });
  }
}

async function rewriteResponse(response, baseUrl) {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    const html = await response.text();
    const rewrittenHtml = rewriteHTML(html, baseUrl);
    return new Response(rewrittenHtml, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('application/javascript')) {
    const js = await response.text();
    const rewrittenJs = rewriteJS(js, baseUrl);
    return new Response(rewrittenJs, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('text/css')) {
    const css = await response.text();
    const rewrittenCss = rewriteCSS(css, baseUrl);
    return new Response(rewrittenCss, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('application/json')) {
    const json = await response.json();
    const rewrittenJson = rewriteJSON(json, baseUrl);
    return new Response(JSON.stringify(rewrittenJson), {
      status: response.status,
      headers: response.headers,
    });
  }
  return response;
}

function rewriteHTML(html, baseUrl) {
  const rewrittenHtml = html
    .replace(/href="\/\//g, `href="${baseUrl}/`)
    .replace(/src="\/\//g, `src="${baseUrl}/`)
    .replace(/url\((\/\//g, `url(${baseUrl}/`);
  return rewrittenHtml;
}

function rewriteJS(js, baseUrl) {
  const rewrittenJs = js
    .replace(/\/\//g, `${baseUrl}/`)
    .replace(/http:\/\//g, `${baseUrl}/`)
    .replace(/https:\/\//g, `${baseUrl}/`);
  return rewrittenJs;
}

function rewriteCSS(css, baseUrl) {
  const rewrittenCss = css
    .replace(/url\((\/\//g, `url(${baseUrl}/`)
    .replace(/http:\/\//g, `${baseUrl}/`)
    .replace(/https:\/\//g, `${baseUrl}/`);
  return rewrittenCss;
}

function rewriteJSON(json, baseUrl) {
  if (typeof json === 'object') {
    for (const key in json) {
      if (typeof json[key] === 'string') {
        json[key] = json[key]
          .replace(/\/\//g, `${baseUrl}/`)
          .replace(/http:\/\//g, `${baseUrl}/`)
          .replace(/https:\/\//g, `${baseUrl}/`);
      } else if (typeof json[key] === 'object') {
        json[key] = rewriteJSON(json[key], baseUrl);
      }
    }
  }
  return json;
}