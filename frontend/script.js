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
  localStorage.setItem('encodingMode', settings.encodingMode);
  localStorage.setItem('cacheEnabled', settings.cacheEnabled);
  localStorage.setItem('adBlockEnabled', settings.adBlockEnabled);
  proxySettings.updateSettings(settings);
};

document.addEventListener('DOMContentLoaded', () => {
  searchBar.render();
  tabBar.render();
  tabManager.render();
  proxyHistory.render();
  bookmarksManager.render();
  settingsPanel.render();
  proxySettings.render();
});

tabManager.onTabUpdate = (tab) => {
  tabBar.updateTab(tab);
};

tabBar.onTabClose = (tab) => {
  tabManager.closeTab(tab);
};

tabBar.onNewTab = () => {
  tabManager.openNewTab();
};

searchBar.onSearchEngineChange = (engine) => {
  localStorage.setItem('searchEngine', engine);
};

proxyHistory.onClearHistory = () => {
  tabManager.clearHistory();
};

bookmarksManager.onBookmarkChange = (bookmark) => {
  tabManager.updateBookmark(bookmark);
};

settingsPanel.onCacheClear = () => {
  tabManager.clearCache();
};

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    tabManager.saveState();
  } else if (document.visibilityState === 'visible') {
    tabManager.restoreState();
  }
});

window.addEventListener('beforeunload', () => {
  tabManager.saveState();
});

tabManager.init();
searchBar.init();
tabBar.init();
bookmarksManager.init();
proxyHistory.init();
settingsPanel.init();
proxySettings.init();