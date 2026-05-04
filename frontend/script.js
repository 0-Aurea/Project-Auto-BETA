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
    const url = searchEngine === 'google' ? 
      `https://www.google.com/search?q=${query}` : 
      `https://www.bing.com/search?q=${query}`;
    window.open(url, '_blank');
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

document.addEventListener('DOMContentLoaded', () => {
  const tabBar = document.querySelector('tab-bar');
  tabBar.addEventListener('tabChange', (tab) => {
    const iframe = document.querySelector(`iframe[src="${tab.url}"]`);
    iframe.contentWindow.postMessage({ type: 'proxyUpdate', settings }, '*');
  });
});

const handleProxyHistory = () => {
  const proxyHistory = [];
  const addToHistory = (url) => {
    proxyHistory.push(url);
    localStorage.setItem('proxyHistory', JSON.stringify(proxyHistory));
  };

  const clearHistory = () => {
    proxyHistory.length = 0;
    localStorage.removeItem('proxyHistory');
  };

  const getHistory = () => {
    const storedHistory = localStorage.getItem('proxyHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  };

  return { addToHistory, clearHistory, getHistory };
};

const proxyHistory = handleProxyHistory();

window.addEventListener('popstate', (event) => {
  if (event.state) {
    const currentUrl = event.state.url;
    proxyHistory.addToHistory(currentUrl);
  }
});

window.addEventListener('pushstate', (event) => {
  if (event.state) {
    const currentUrl = event.state.url;
    proxyHistory.addToHistory(currentUrl);
  }
});

window.addEventListener('replacestate', (event) => {
  if (event.state) {
    const currentUrl = event.state.url;
    proxyHistory.addToHistory(currentUrl);
  }
});

const bookmarksManager = {
  addBookmark: (title, url) => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    bookmarks.push({ title, url });
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  },

  removeBookmark: (url) => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.url !== url);
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
  },

  getBookmarks: () => {
    const storedBookmarks = localStorage.getItem('bookmarks');
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  },
};

const settingsPanel = {
  toggleSettings: () => {
    const settingsPanelElement = document.querySelector('settings-panel');
    settingsPanelElement.classList.toggle('open');
  },
};

const handleAdBlock = () => {
  const adBlockList = settings.adBlockList;
  const filterList = adBlockList.join('\n');

  const adBlockFilter = `
    [${filterList}]
  `;

  const style = document.createElement('style');
  style.textContent = `
    ${adBlockFilter} {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
};

handleAdBlock();

const handlePrefetch = () => {
  const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
  prefetchLinks.forEach((link) => {
    const href = link.href;
    fetch(href)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.href = url;
        document.head.appendChild(prefetchLink);
      });
  });
};

handlePrefetch();