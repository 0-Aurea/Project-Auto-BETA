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
  // Update settings
};

document.addEventListener('DOMContentLoaded', () => {
  searchBar.render();
  tabManager.render();
  proxyHistory.render();
  bookmarksManager.render();
  settingsPanel.render();
});

window.addEventListener('beforeunload', () => {
  tabManager.saveTabs();
  proxyHistory.saveHistory();
  bookmarksManager.saveBookmarks();
});

window.addEventListener('message', (event) => {
  if (event.data.type === 'tab-update') {
    tabManager.updateTab(event.data.tab);
  } else if (event.data.type === 'search-query') {
    searchBar.setSearchQuery(event.data.query);
  }
});

tabManager.onTabClose = (tab) => {
  searchBar.removeSearchQuery(tab.url);
};

tabManager.onTabUpdate = (tab) => {
  searchBar.updateSearchQuery(tab.url);
};

searchBar.onSearchFocus = () => {
  tabManager.updateActiveTab();
};

searchBar.onSearchBlur = () => {
  tabManager.updateActiveTab();
};

settingsPanelElement.addEventListener('click', (event) => {
  if (event.target.classList.contains('ad-block-toggle')) {
    const adBlockEnabled = event.target.checked;
    settingsPanel.updateSettings({ adBlockEnabled });
  }

  if (event.target.classList.contains('cache-toggle')) {
    const cacheEnabled = event.target.checked;
    settingsPanel.updateSettings({ cacheEnabled });
  }

  if (event.target.classList.contains('encoding-mode-select')) {
    const encodingMode = event.target.value;
    settingsPanel.updateSettings({ encodingMode });
  }
});