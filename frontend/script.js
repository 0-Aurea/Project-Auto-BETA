import React from 'react';
import ReactDOM from 'react-dom';
import TabManager from './components/TabManager';
import ProxySettings from './components/ProxySettings';
import ProxyHistory from './components/ProxyHistory';
import BookmarksManager from './components/BookmarksManager';
import SettingsPanel from './components/SettingsPanel';
import SearchBar from './components/SearchBar';
import './style.css';

const App = () => {
  return (
    <div className="app-container">
      <SearchBar />
      <TabManager />
      <ProxySettings />
      <ProxyHistory />
      <BookmarksManager />
      <SettingsPanel />
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('sw.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
} else {
  console.log('Service Worker is not supported.');
}

// Handle messages from Service Worker
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'updateTab') {
    const tabId = event.data.tabId;
    const tabUrl = event.data.tabUrl;
    // Update tab URL in TabManager
    const tabManager = document.querySelector('TabManager');
    if (tabManager) {
      tabManager.updateTab(tabId, tabUrl);
    }
  } else if (event.data.type === 'addHistory') {
    const historyItem = event.data.historyItem;
    // Add history item in ProxyHistory
    const proxyHistory = document.querySelector('ProxyHistory');
    if (proxyHistory) {
      proxyHistory.addHistory(historyItem);
    }
  }
});

// Initialize proxy connection
const proxyUrl = '/proxy';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Send a test request to the proxy to ensure it's working
fetch(proxyUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log('Proxy connection established.');
    } else {
      console.error('Proxy connection failed:', data.error);
    }
  })
  .catch((error) => {
    console.error('Proxy connection failed:', error);
  });

// Handle tab updates
document.addEventListener('tabUpdated', (event) => {
  const tabId = event.detail.tabId;
  const tabUrl = event.detail.tabUrl;
  // Send a message to the Service Worker to update the tab URL
  navigator.serviceWorker.controller.postMessage({
    type: 'updateTab',
    tabId,
    tabUrl,
  });
});

// Handle history updates
document.addEventListener('historyUpdated', (event) => {
  const historyItem = event.detail.historyItem;
  // Send a message to the Service Worker to add the history item
  navigator.serviceWorker.controller.postMessage({
    type: 'addHistory',
    historyItem,
  });
});

// Initialize search bar
const searchBar = document.querySelector('SearchBar');
if (searchBar) {
  searchBar.addEventListener('search', (event) => {
    const searchQuery = event.detail.searchQuery;
    // Send a message to the Service Worker to perform the search
    navigator.serviceWorker.controller.postMessage({
      type: 'search',
      searchQuery,
    });
  });
}

// Initialize tab manager
const tabManager = document.querySelector('TabManager');
if (tabManager) {
  tabManager.addEventListener('tabUpdated', (event) => {
    const tabId = event.detail.tabId;
    const tabUrl = event.detail.tabUrl;
    // Send a message to the Service Worker to update the tab URL
    navigator.serviceWorker.controller.postMessage({
      type: 'updateTab',
      tabId,
      tabUrl,
    });
  });
}

// Initialize bookmarks manager
const bookmarksManager = document.querySelector('BookmarksManager');
if (bookmarksManager) {
  bookmarksManager.addEventListener('bookmarkAdded', (event) => {
    const bookmark = event.detail.bookmark;
    // Send a message to the Service Worker to add the bookmark
    navigator.serviceWorker.controller.postMessage({
      type: 'addBookmark',
      bookmark,
    });
  });
}

// Initialize settings panel
const settingsPanel = document.querySelector('SettingsPanel');
if (settingsPanel) {
  settingsPanel.addEventListener('settingsUpdated', (event) => {
    const settings = event.detail.settings;
    // Send a message to the Service Worker to update the settings
    navigator.serviceWorker.controller.postMessage({
      type: 'updateSettings',
      settings,
    });
  });
}