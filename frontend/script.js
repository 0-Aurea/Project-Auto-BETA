import { TabManager } from './components/TabManager.js';
import { SearchBar } from './components/SearchBar.js';
import { SettingsManager } from './components/SettingsManager.js';
import { HistoryManager } from './components/HistoryManager.js';
import { BookmarkManager } from './components/BookmarkManager.js';
import { encode, decode } from './sw-config.js';
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

const settingsManager = new SettingsManager(settingsPanelElement);
const bookmarksManager = new BookmarkManager(bookmarksPanelElement);
const historyManager = new HistoryManager(proxyHistoryPanelElement);
const tabManager = new TabManager(tabBarElement);
const searchBar = new SearchBar({ onSearchQuery: (query) => {
  const encodedUrl = encode(query);
  tabManager.openNewTab(encodedUrl);
}, tabManager, swConfig: { encode, decode } });

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

tabManager.onTabChange = (tab) => {
  searchBar.setSearchQuery(tab.url);
};

historyManager.onHistoryChange = (history) => {
  searchBar.setSearchQuery(history[history.length - 1].url);
};

bookmarksManager.onBookmarkClick = (bookmark) => {
  tabManager.openNewTab(bookmark.url);
};

settingsManager.onSettingsChange = (settings) => {
  tabManager.updateTabSettings(settings);
  searchBar.updateSearchSettings(settings);
};

tabManager.onTabClose = (tab) => {
  historyManager.removeHistoryEntry(tab.url);
};

tabManager.onTabUpdate = (tab) => {
  historyManager.updateHistoryEntry(tab.url);
};

searchBar.onSearchError = (error) => {
  console.error('Search error:', error);
};

bookmarksManager.onBookmarkAdd = (bookmark) => {
  historyManager.addHistoryEntry(bookmark.url);
};

bookmarksManager.onBookmarkRemove = (bookmark) => {
  historyManager.removeHistoryEntry(bookmark.url);
};

historyManager.onHistoryClear = () => {
  tabManager.clearTabs();
};

settingsManager.onCacheClear = () => {
  historyManager.clearHistory();
  tabManager.clearTabs();
};

document.addEventListener('DOMContentLoaded', () => {
  tabManager.init();
  searchBar.init();
  bookmarksManager.init();
  historyManager.init();
  settingsManager.init();
});

window.addEventListener('beforeunload', () => {
  tabManager.saveTabs();
});

navigator.serviceWorker.register('./sw.js')
  .then((registration) => {
    console.log('Service Worker registered:', registration);
  })
  .catch((error) => {
    console.error('Service Worker registration failed:', error);
  });

document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 't') {
    tabManager.openNewTab('');
  } else if (event.ctrlKey && event.key === 'w') {
    tabManager.closeActiveTab();
  } else if (event.ctrlKey && event.key === 'l') {
    searchBar.focus();
  }
});