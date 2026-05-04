import { register } from './serviceWorker.js';
import { WebRTCLeakProtector } from './WebRTCLeakProtector.js';
import { TabManager } from './components/TabManager.js';
import { ProxyHistory } from './components/ProxyHistory.js';
import { BookmarksManager } from './components/BookmarksManager.js';
import { SearchBar } from './components/SearchBar.js';
import './style.css';

const settingsToggle = document.getElementById('settings-toggle');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const proxyHistoryToggle = document.getElementById('proxy-history-toggle');

const settingsPanel = document.createElement('div');
settingsPanel.classList.add('settings-panel');
document.body.appendChild(settingsPanel);

const bookmarksPanel = document.createElement('div');
bookmarksPanel.classList.add('bookmarks-panel');
document.body.appendChild(bookmarksPanel);

const proxyHistoryPanel = document.createElement('div');
proxyHistoryPanel.classList.add('proxy-history-panel');
document.body.appendChild(proxyHistoryPanel);

let webrtcProtector;

register({
  onProxyRequest: (event) => {
    if (!webrtcProtector) {
      webrtcProtector = new WebRTCLeakProtector();
    }
    webrtcProtector.protect(event);
  },
});

settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('open');
  bookmarksPanel.classList.remove('open');
  proxyHistoryPanel.classList.remove('open');
});

bookmarksToggle.addEventListener('click', () => {
  bookmarksPanel.classList.toggle('open');
  settingsPanel.classList.remove('open');
  proxyHistoryPanel.classList.remove('open');
});

proxyHistoryToggle.addEventListener('click', () => {
  proxyHistoryPanel.classList.toggle('open');
  settingsPanel.classList.remove('open');
  bookmarksPanel.classList.remove('open');
});

const tabManager = new TabManager();
const proxyHistory = new ProxyHistory();
const bookmarksManager = new BookmarksManager();
const searchBar = new SearchBar();

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

settingsPanel.addEventListener('click', (event) => {
  if (event.target.classList.contains('ad-block-toggle')) {
    const adBlockEnabled = event.target.checked;
    // Update ad block settings
  }

  if (event.target.classList.contains('cache-toggle')) {
    const cacheEnabled = event.target.checked;
    // Update cache settings
  }

  if (event.target.classList.contains('encoding-mode-select')) {
    const encodingMode = event.target.value;
    // Update encoding mode
  }
});

document.addEventListener('DOMContentLoaded', () => {
  searchBar.render();
  tabManager.render();
  proxyHistory.render();
  bookmarksManager.render();
});

window.addEventListener('beforeunload', () => {
  tabManager.saveTabs();
  proxyHistory.saveHistory();
  bookmarksManager.saveBookmarks();
});