import { TabManager } from './components/TabManager.js';
import { SearchBar } from './components/SearchBar.js';
import { SettingsManager } from './components/SettingsManager.js';
import { HistoryManager } from './components/HistoryManager.js';
import { BookmarkManager } from './components/BookmarkManager.js';
import { encode, decode } from './sw-config.js';

const settingsToggle = document.getElementById('settings-toggle');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const proxyHistoryToggle = document.getElementById('proxy-history-toggle');
const tabBarElement = document.getElementById('tab-bar');
const viewportElement = document.getElementById('viewport');
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

const settingsManager = new SettingsManager({ settingsPanelElement });
const bookmarksManager = new BookmarkManager({ bookmarksPanelElement });
const historyManager = new HistoryManager({ proxyHistoryPanelElement });
const tabManager = new TabManager({ 
  tabBarElement, 
  viewportElement, 
  onTabChange: (tab) => {
    searchBar.setSearchQuery(tab.url);
  }
});

const searchBar = new SearchBar({ 
  onSearchQuery: (query) => {
    const encodedUrl = encode(query);
    tabManager.navigate(encodedUrl);
  }, 
  tabManager, 
  swConfig: { encode, decode } 
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
    tabManager.addTab();
    event.preventDefault();
  } else if (event.ctrlKey && event.key === 'w') {
    tabManager.closeActiveTab();
    event.preventDefault();
  } else if (event.ctrlKey && event.key === 'l') {
    searchBar.focus();
    event.preventDefault();
  }
});

tabManager.onTabChange = (tab) => {
  searchBar.setSearchQuery(tab.url);
};
tabManager.onTabChange = (tab) => {
  if (tab) {
    searchBar.setSearchQuery(tab.url);
  }
};

searchBarElement.addEventListener('submit', (event) => {
  event.preventDefault();
  const searchQuery = searchBar.getSearchQuery();
  const encodedUrl = encode(searchQuery);
  tabManager.navigate(encodedUrl);
});