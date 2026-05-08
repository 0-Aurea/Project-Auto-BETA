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
        const rewrittenResponse = await rewriteResponse(response);
        return rewrittenResponse;
      }
    }
  }

  const cacheResponse = await getResponse(request);
  if (cacheResponse) {
    return cacheResponse;
  }

  try {
    const response = await fetch(request);
    const rewrittenResponse = await rewriteResponse(response);
    await putResponse(request, rewrittenResponse.clone());
    return rewrittenResponse;
  } catch (error) {
    console.error('Error handling fetch:', error);
    return new Response('Error', { status: 500 });
  }
}

async function rewriteResponse(response) {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/html')) {
    const html = await response.text();
    const rewrittenHtml = rewriteHTML(html, response.url);
    return new Response(rewrittenHtml, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('application/javascript')) {
    const js = await response.text();
    const rewrittenJs = rewriteJS(js, response.url);
    return new Response(rewrittenJs, {
      status: response.status,
      headers: response.headers,
    });
  } else if (contentType && contentType.includes('text/css')) {
    const css = await response.text();
    const rewrittenCss = rewriteCSS(css, response.url);
    return new Response(rewrittenCss, {
      status: response.status,
      headers: response.headers,
    });
  }
  return response;
}

function rewriteHTML(html, baseUrl) {
  const rewrittenHtml = html.replace(/href="\/\//g, `href="${baseUrl}/`);
  return rewrittenHtml.replace(/src="\/\//g, `src="${baseUrl}/`);
}

function rewriteJS(js, baseUrl) {
  const rewrittenJs = js.replace(/\/\//g, `${baseUrl}/`);
  return rewrittenJs;
}

function rewriteCSS(css, baseUrl) {
  const rewrittenCss = css.replace(/url\((\/\//g, `url(${baseUrl}/`);
  return rewrittenCss;
}