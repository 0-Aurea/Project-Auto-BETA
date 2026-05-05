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

searchBar.onSearchEngineChange = (engine) => {
  settingsPanel.updateSettings({ searchEngine: engine });
};

bookmarksManager.onBookmarkAdd = (bookmark) => {
  proxyHistory.addHistoryEntry(bookmark.url);
};

bookmarksManager.onBookmarkRemove = (bookmark) => {
  proxyHistory.removeHistoryEntry(bookmark.url);
};

window.addEventListener('beforeunload', () => {
  tabManager.saveTabs();
  bookmarksManager.saveBookmarks();
  proxyHistory.saveHistory();
});

window.addEventListener('load', () => {
  tabManager.restoreTabs();
  bookmarksManager.restoreBookmarks();
  proxyHistory.restoreHistory();
});

window.addEventListener('online', () => {
  tabManager.updateTabStatus();
});

window.addEventListener('offline', () => {
  tabManager.updateTabStatus();
});

searchBarElement.addEventListener('focus', () => {
  searchBarElement.classList.add('focused');
});

searchBarElement.addEventListener('blur', () => {
  searchBarElement.classList.remove('focused');
});

tabBarElement.addEventListener('dragover', (e) => {
  e.preventDefault();
});

tabBarElement.addEventListener('drop', (e) => {
  e.preventDefault();
  const tab = tabManager.getTabAtPosition(e.clientX);
  if (tab) {
    tabManager.moveTab(tab, e.clientX);
  }
});

tabBarElement.addEventListener('dragstart', (e) => {
  const tab = tabManager.getTabAtPosition(e.clientX);
  if (tab) {
    e.dataTransfer.setData('text', tab.id);
  }
});

tabBarElement.addEventListener('dragend', (e) => {
  tabManager.updateTabPositions();
});

settingsPanelElement.addEventListener('animationstart', () => {
  settingsPanelElement.classList.add('animating');
});

settingsPanelElement.addEventListener('animationend', () => {
  settingsPanelElement.classList.remove('animating');
});

bookmarksPanelElement.addEventListener('animationstart', () => {
  bookmarksPanelElement.classList.add('animating');
});

bookmarksPanelElement.addEventListener('animationend', () => {
  bookmarksPanelElement.classList.remove('animating');
});

proxyHistoryPanelElement.addEventListener('animationstart', () => {
  proxyHistoryPanelElement.classList.add('animating');
});

proxyHistoryPanelElement.addEventListener('animationend', () => {
  proxyHistoryPanelElement.classList.remove('animating');
});