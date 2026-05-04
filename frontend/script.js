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
    if (settingsPanel) {
      settingsPanel.toggleSettings();
    } else {
      console.error('Settings panel not found');
    }
  });

  const bookmarksToggle = document.getElementById('bookmarks-toggle');
  bookmarksToggle.addEventListener('click', () => {
    const bookmarksManager = document.querySelector('bookmarks-manager');
    if (bookmarksManager) {
      bookmarksManager.toggleBookmarks();
    } else {
      console.error('Bookmarks manager not found');
    }
  });

  const proxyHistoryToggle = document.getElementById('proxy-history-toggle');
  proxyHistoryToggle.addEventListener('click', () => {
    const proxyHistory = document.querySelector('proxy-history');
    if (proxyHistory) {
      proxyHistory.toggleProxyHistory();
    } else {
      console.error('Proxy history not found');
    }
  });

  const searchBar = document.querySelector('search-bar');
  if (searchBar) {
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
  } else {
    console.error('Search bar not found');
  }

  const tabBar = document.querySelector('tab-bar');
  if (tabBar) {
    tabBar.addEventListener('tabChange', (tabId) => {
      const tab = tabBar.getTab(tabId);
      if (tab) {
        const url = tab.url;
        const proxiedUrl = `${proxy}?url=${encodeURIComponent(url)}`;
        tabBar.updateTab(tabId, { url: proxiedUrl });
      }
    });
  } else {
    console.error('Tab bar not found');
  }

  const bookmarksManager = document.querySelector('bookmarks-manager');
  if (bookmarksManager) {
    bookmarksManager.addEventListener('bookmarkClick', (bookmark) => {
      const url = bookmark.url;
      const proxiedUrl = `${proxy}?url=${encodeURIComponent(url)}`;
      const tab = window.open(proxiedUrl, '_blank');
      tab.focus();
    });
  } else {
    console.error('Bookmarks manager not found');
  }
};

document.addEventListener('DOMContentLoaded', init);

const handleTabUpdate = (tabId, changeInfo, tab) => {
  const tabBar = document.querySelector('tab-bar');
  if (tabBar) {
    tabBar.updateTab(tabId, tab);
  }
};

chrome.tabs.onUpdated.addListener(handleTabUpdate);

const handleTabRemove = (tabId) => {
  const tabBar = document.querySelector('tab-bar');
  if (tabBar) {
    tabBar.removeTab(tabId);
  }
};

chrome.tabs.onRemoved.addListener(handleTabRemove);