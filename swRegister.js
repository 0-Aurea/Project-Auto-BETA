const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('sw.js', {
        scope: '/',
        type: 'module',
      });

      console.log('Service Worker registered:', registration);

      registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found');
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              console.log('Service Worker installed');
              if (navigator.serviceWorker.controller) {
                console.log('New Service Worker took control');
              } else {
                console.log('Service Worker activated');
              }
            }
          });
        }
      });

      registration.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
      });

      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from Service Worker:', event.data);
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.error('Service Worker is not supported in this browser');
  }
};

document.addEventListener('DOMContentLoaded', registerServiceWorker);

navigator.serviceWorker.getRegistration().then((registration) => {
  if (registration) {
    registration.unregister().then(() => {
      console.log('Previous Service Worker unregistered');
      registerServiceWorker();
    });
  } else {
    registerServiceWorker();
  }
});

window.addEventListener('load', () => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('activate');
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration) {
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage('activate');
            }
          });
        }
      });
    }
  });
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== 'nexus-cache') {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        const responseToCache = response.clone();
        caches.open('nexus-cache').then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});