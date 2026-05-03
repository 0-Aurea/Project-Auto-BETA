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
  }
});

window.addEventListener('load', () => {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('activate');
  }
});

const handleFetch = (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          return response;
        } else {
          return new Response('Error', { status: 500 });
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        return new Response('Error', { status: 500 });
      })
  );
};

self.addEventListener('fetch', handleFetch);