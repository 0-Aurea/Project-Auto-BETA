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
      });

      registration.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.error('Service Worker is not supported in this browser');
  }
};

document.addEventListener('DOMContentLoaded', registerServiceWorker);