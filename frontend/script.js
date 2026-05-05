import { register } from './serviceWorker.js';
import { WebRTCLeakProtector } from './WebRTCLeakProtector.js';
import { TabManager } from './components/TabManager.js';
import { ProxyHistory } from './components/ProxyHistory.js';
import { BookmarksManager } from './components/BookmarksManager.js';
import { SearchBar } from './components/SearchBar.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { TabBar } from './components/TabBar.js';
import { ProxySettings } from './components/ProxySettings.js';
import './style.css';

const settingsToggle = document.getElementById('settings-toggle');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const proxyHistoryToggle = document.getElementById('proxy-history-toggle');
const tabBarElement = document.getElementById('tab-bar');
const searchBarElement = document.getElementById('search-bar');
const settingsPanelElement = document.createElement('div');
const bookmarksPanelElement = document.createElement('div');
const proxyHistoryPanelElement = document.createElement('div');

settingsPanelElement.classList.add('settings-panel');
bookmarksPanelElement.classList.add('bookmarks-panel');
proxyHistoryPanelElement.classList.add('proxy-history-panel');

document.body.appendChild(settingsPanelElement);
document.body.appendChild(bookmarksPanelElement);
document.body.appendChild(proxyHistoryPanelElement);

let webrtcProtector;

const settingsPanel = new SettingsPanel(settingsPanelElement);
const bookmarksManager = new BookmarksManager(bookmarksPanelElement);
const proxyHistory = new ProxyHistory(proxyHistoryPanelElement);
const tabManager = new TabManager(tabBarElement);
const searchBar = new SearchBar(searchBarElement);
const tabBar = new TabBar(tabBarElement);
const proxySettings = new ProxySettings();

register({
  onProxyRequest: (event) => {
    if (!webrtcProtector) {
      webrtcProtector = new WebRTCLeakProtector();
    }
    webrtcProtector.protect(event);
  },
});

settingsToggle.addEventListener('click', () => {
  settingsPanelElement.classList.toggle('open');
  bookmarksPanelElement.classList.remove('open');
  proxyHistoryPanelElement.classList.remove('open');
});

bookmarksToggle.addEventListener('click', () => {
  bookmarksPanelElement.classList.toggle('open');
  settingsPanelElement.classList.remove('open');
  proxyHistoryPanelElement.classList.remove('open');
});

proxyHistoryToggle.addEventListener('click', () => {
  proxyHistoryPanelElement.classList.toggle('open');
  settingsPanelElement.classList.remove('open');
  bookmarksPanelElement.classList.remove('open');
});

searchBar.onSearchQuery = (query) => {
  tabManager.openNewTab(query);
};

tabManager.onTabChange = (tab) => {
  searchBar.setSearchQuery(tab.url);
};

proxyHistory.onHistoryChange = (history) => {
  searchBar.setSearchQuery(history[history.length - 1].url);
};

bookmarksManager.onBookmarkClick = (bookmark) => {
  tabManager.openNewTab(bookmark.url);
};

settingsPanel.onSettingsChange = (settings) => {
  proxySettings.updateSettings(settings);
};

// Initialize service worker
navigator.serviceWorker.register('serviceWorker.js')
  .then((registration) => {
    console.log('Service worker registered:', registration);
  })
  .catch((error) => {
    console.error('Service worker registration failed:', error);
  });

// Handle tab updates
tabManager.onTabUpdate = (tab) => {
  // Update search bar query
  searchBar.setSearchQuery(tab.url);

  // Update proxy history
  proxyHistory.addHistoryEntry(tab.url);
};

// Handle search bar input
searchBar.onSearchInput = (query) => {
  // Update tab bar query
  tabManager.updateTabQuery(query);
};

// Initialize UI components
settingsPanel.init();
bookmarksManager.init();
proxyHistory.init();
tabManager.init();
searchBar.init();

// Establish communication with service worker
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'proxyRequest') {
    // Handle proxy request from service worker
    const { url, headers } = event.data;
    // Process proxy request...
  } else if (event.data.type === 'proxyResponse') {
    // Handle proxy response from service worker
    const { url, headers, body } = event.data;
    // Process proxy response...
  }
});

// Handle errors
window.addEventListener('error', (event) => {
  console.error('Error occurred:', event.error);
});

// Cleanup on unload
window.addEventListener('unload', () => {
  // Clean up resources...
});