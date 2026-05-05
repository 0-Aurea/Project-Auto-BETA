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
  tabManager.updateTabSettings(settings);
  searchBar.updateSearchSettings(settings);
};

tabManager.onTabClose = (tab) => {
  proxyHistory.removeHistoryEntry(tab.url);
};

tabManager.onTabUpdate = (tab) => {
  proxyHistory.updateHistoryEntry(tab.url);
};

searchBar.onSearchError = (error) => {
  console.error('Search error:', error);
};

bookmarksManager.onBookmarkAdd = (bookmark) => {
  proxyHistory.addHistoryEntry(bookmark.url);
};

bookmarksManager.onBookmarkRemove = (bookmark) => {
  proxyHistory.removeHistoryEntry(bookmark.url);
};

proxyHistory.onHistoryClear = () => {
  tabManager.clearTabs();
};

settingsPanel.onCacheClear = () => {
  proxyHistory.clearHistory();
  tabManager.clearTabs();
};

document.addEventListener('DOMContentLoaded', () => {
  tabManager.init();
  searchBar.init();
  bookmarksManager.init();
  proxyHistory.init();
  settingsPanel.init();
});

window.addEventListener('beforeunload', () => {
  tabManager.saveTabs();
  bookmarksManager.saveBookmarks();
  proxyHistory.saveHistory();
  settingsPanel.saveSettings();
});

window.addEventListener('unload', () => {
  tabManager.closeTabs();
});