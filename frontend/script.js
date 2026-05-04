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
    tabBar.addEventListener('tabCreated', (tab) => {
      const { id, url, title, icon } = tab;
      const iframe = document.createElement('iframe');
      iframe.src = `${proxy}?url=${encodeURIComponent(url)}`;
      iframe.id = id;
      iframe.title = title;
      iframe.dataset.icon = icon;
      document.getElementById('tab-container').appendChild(iframe);
    });

    tabBar.addEventListener('tabUpdated', (tab) => {
      const { id, url, title, icon } = tab;
      const iframe = document.getElementById(id);
      if (iframe) {
        iframe.src = `${proxy}?url=${encodeURIComponent(url)}`;
        iframe.title = title;
        iframe.dataset.icon = icon;
      }
    });

    tabBar.addEventListener('tabRemoved', (id) => {
      const iframe = document.getElementById(id);
      if (iframe) {
        iframe.remove();
      }
    });
  } else {
    console.error('Tab bar not found');
  }
};

init();

// Listen for messages from the service worker
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'tabUpdated') {
    const tabBar = document.querySelector('tab-bar');
    if (tabBar) {
      tabBar.updateTab(event.data.tab);
    }
  } else if (event.data.type === 'tabRemoved') {
    const tabBar = document.querySelector('tab-bar');
    if (tabBar) {
      tabBar.removeTab(event.data.id);
    }
  }
});

// Listen for tab changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    connectToProxy();
  }
});

// Periodically sync settings with the service worker
setInterval(() => {
  connectToProxy();
}, 10000);

// Handle search bar suggestions
const searchBar = document.querySelector('search-bar');
if (searchBar) {
  searchBar.addEventListener('input', (event) => {
    const query = event.target.value.trim();
    if (query) {
      fetch(`https://api.${settings.searchEngine}.com/suggestions?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((suggestions) => {
          searchBar.suggestions = suggestions;
          searchBar.showSuggestions = true;
        })
        .catch((error) => console.error('Error fetching suggestions:', error));
    } else {
      searchBar.suggestions = [];
      searchBar.showSuggestions = false;
    }
  });
}

// Initialize tab manager
const tabManager = document.querySelector('tab-manager');
if (tabManager) {
  tabManager.init();
}

// Initialize settings panel
const settingsPanel = document.querySelector('settings-panel');
if (settingsPanel) {
  settingsPanel.init();
}

// Initialize bookmarks manager
const bookmarksManager = document.querySelector('bookmarks-manager');
if (bookmarksManager) {
  bookmarksManager.init();
}