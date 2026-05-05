import { register } from './serviceWorker.js';
import { WebRTCLeakProtector } from './WebRTCLeakProtector.js';
import { TabManager } from './components/TabManager.js';
import { ProxyHistory } from './components/ProxyHistory.js';
import { BookmarksManager } from './components/BookmarksManager.js';
import { SearchBar } from './components/SearchBar.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import './style.css';

const settingsToggle = document.getElementById('settings-toggle');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const proxyHistoryToggle = document.getElementById('proxy-history-toggle');

const settingsPanelElement = document.createElement('div');
settingsPanelElement.classList.add('settings-panel');
document.body.appendChild(settingsPanelElement);

const bookmarksPanelElement = document.createElement('div');
bookmarksPanelElement.classList.add('bookmarks-panel');
document.body.appendChild(bookmarksPanelElement);

const proxyHistoryPanelElement = document.createElement('div');
proxyHistoryPanelElement.classList.add('proxy-history-panel');
document.body.appendChild(proxyHistoryPanelElement);

let webrtcProtector;

const settingsPanel = new SettingsPanel(settingsPanelElement);
const bookmarksManager = new BookmarksManager(bookmarksPanelElement);
const proxyHistory = new ProxyHistory(proxyHistoryPanelElement);
const tabManager = new TabManager();
const searchBar = new SearchBar();

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
  localStorage.setItem('encodingMode', settings.encodingMode);
  localStorage.setItem('cacheEnabled', settings.cacheEnabled);
  localStorage.setItem('adBlockEnabled', settings.adBlockEnabled);
};

document.addEventListener('DOMContentLoaded', () => {
  searchBar.render();
  tabManager.render();
  proxyHistory.render();
  bookmarksManager.render();
  settingsPanel.render();

  const storedSettings = {
    encodingMode: localStorage.getItem('encodingMode'),
    cacheEnabled: localStorage.getItem('cacheEnabled') === 'true',
    adBlockEnabled: localStorage.getItem('adBlockEnabled') === 'true',
  };
  settingsPanel.updateSettings(storedSettings);
});

window.addEventListener('beforeunload', () => {
  tabManager.saveTabs();
  proxyHistory.saveHistory();
  bookmarksManager.saveBookmarks();
});

window.addEventListener('unload', () => {
  searchBar.destroy();
  tabManager.destroy();
  proxyHistory.destroy();
  bookmarksManager.destroy();
  settingsPanel.destroy();
});

window.onerror = (event) => {
  console.error('Error:', event);
};

window.onunhandledrejection = (event) => {
  console.error('Unhandled rejection:', event);
};