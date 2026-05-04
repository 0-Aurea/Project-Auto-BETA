const { proxy } = chrome.runtime.getURL('proxy') ? 
  chrome.runtime.getURL('proxy') : '/proxy';

const settings = {
  encodingMode: 'xor-base64',
  cacheEnabled: true,
  cacheTTL: 3600,
  prefetchEnabled: true,
  adBlockEnabled: true,
  adBlockList: [],
  searchEngine: 'google',
};

const loadSettings = () => {
  const storedSettings = localStorage.getItem('settings');
  if (storedSettings) {
    Object.assign(settings, JSON.parse(storedSettings));
  }
};

const saveSettings = () => {
  localStorage.setItem('settings', JSON.stringify(settings));
};

const connectToProxy = () => {
  const serviceWorker = navigator.serviceWorker.controller;
  if (serviceWorker) {
    serviceWorker.postMessage({ type: 'init', settings });
  } else {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const newServiceWorker = navigator.serviceWorker.controller;
      if (newServiceWorker) {
        newServiceWorker.postMessage({ type: 'init', settings });
      }
    });
  }
};

const handleSettingsChange = (key, value) => {
  settings[key] = value;
  saveSettings();
  connectToProxy();
};

const handleSearchEngineChange = (engine) => {
  settings.searchEngine = engine;
  saveSettings();
};

const init = () => {
  loadSettings();
  connectToProxy();

  const settingsToggle = document.getElementById('settings-toggle');
  settingsToggle.addEventListener('click', () => {
    const settingsPanel = document.querySelector('settings-panel');
    settingsPanel.toggleSettings();
  });

  const bookmarksToggle = document.getElementById('bookmarks-toggle');
  bookmarksToggle.addEventListener('click', () => {
    const bookmarksManager = document.querySelector('bookmarks-manager');
    bookmarksManager.toggleBookmarks();
  });

  const proxyHistoryToggle = document.getElementById('proxy-history-toggle');
  proxyHistoryToggle.addEventListener('click', () => {
    const proxyHistory = document.querySelector('proxy-history');
    proxyHistory.toggleProxyHistory();
  });

  const searchBar = document.querySelector('search-bar');
  searchBar.addEventListener('search', (query) => {
    const { searchEngine } = settings;
    let url;
    if (searchEngine === 'google') {
      url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    } else if (searchEngine === 'bing') {
      url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    } else {
      console.error('Unsupported search engine:', searchEngine);
      return;
    }
    const tab = window.open(url, '_blank');
    tab.focus();
  });
};

init();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'updateSettings') {
    handleSettingsChange(request.key, request.value);
  } else if (request.type === 'updateSearchEngine') {
    handleSearchEngineChange(request.engine);
  }
});

navigator.serviceWorker.register('service-worker.js')
  .then((registration) => {
    console.log('Service worker registered:', registration);
  })
  .catch((error) => {
    console.error('Service worker registration failed:', error);
  });

window.addEventListener('message', (event) => {
  if (event.data.type === 'proxyUpdate') {
    const { key, value } = event.data;
    handleSettingsChange(key, value);
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { type: 'tabUpdated' });
  }
});

// Handle search queries from the omnibox
chrome.omnibox.onInputEntered.addListener((text) => {
  const { searchEngine } = settings;
  let url;
  if (searchEngine === 'google') {
    url = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
  } else if (searchEngine === 'bing') {
    url = `https://www.bing.com/search?q=${encodeURIComponent(text)}`;
  } else {
    console.error('Unsupported search engine:', searchEngine);
    return;
  }
  chrome.tabs.create({ url });
});

// Periodically sync settings with the service worker
setInterval(() => {
  connectToProxy();
}, 10000);