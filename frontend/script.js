import { TabManager } from './components/TabManager.js';
import { SearchBar } from './components/SearchBar.js';
import { SettingsManager } from './components/SettingsManager.js';
import { HistoryManager } from './components/HistoryManager.js';
import { BookmarkManager } from './components/BookmarkManager.js';
import { NexusLogo } from './components/NexusLogo.js';
import { encode, decode } from './sw-config.js';

const settingsToggle = document.getElementById('settings-toggle');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const historyToggle = document.getElementById('history-toggle');
const tabBarElement = document.getElementById('tab-bar');
const viewportElement = document.getElementById('viewport');
const searchBarElement = document.getElementById('search-bar');
const navLogoElement = document.getElementById('nav-logo');
const settingsPanelElement = document.createElement('div');
const bookmarksPanelElement = document.createElement('div');
const historyPanelElement = document.createElement('div');

settingsPanelElement.classList.add('settings-panel');
bookmarksPanelElement.classList.add('bookmarks-panel');
historyPanelElement.classList.add('history-panel');

document.body.appendChild(settingsPanelElement);
document.body.appendChild(bookmarksPanelElement);
document.body.appendChild(historyPanelElement);

const nexusLogo = new NexusLogo({ logoContainerElement: navLogoElement });

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
  swConfig: { encode, decode },
  searchBarElement
});

const settingsManager = new SettingsManager({ settingsPanelElement });
const bookmarksManager = new BookmarkManager({ bookmarksPanelElement });
const historyManager = new HistoryManager({ historyPanelElement });

settingsToggle.addEventListener('click', () => {
  settingsPanelElement.classList.toggle('open');
  bookmarksPanelElement.classList.remove('open');
  historyPanelElement.classList.remove('open');
});

bookmarksToggle.addEventListener('click', () => {
  bookmarksPanelElement.classList.toggle('open');
  settingsPanelElement.classList.remove('open');
  historyPanelElement.classList.remove('open');
});

historyToggle.addEventListener('click', () => {
  historyPanelElement.classList.toggle('open');
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
  tabManager.addTab();
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
 
// Focus search bar when the page loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    searchBar.focus();
  }, 100);
});
 
// Update the URL in the address bar when the active tab changes
tabManager.onTabChange = (tab) => {
  if (tab) {
    const decodedUrl = decode(tab.url);
    history.pushState({}, '', decodedUrl);
  }
};
 
// Navigate to the URL when the user presses the enter key in the search bar
searchBarElement.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchBar.handleSearch();
  }
});
 
// Prevent the default form submission behavior
searchBarElement.addEventListener('submit', (event) => {
  event.preventDefault();
  searchBar.handleSearch();
});
 
// Initialize the search engine selection
searchBar.initSearchEngineSelection();
 
// Update the search engine selection when the user changes it
searchBarElement.addEventListener('change', (event) => {
  if (event.target === searchBar.searchEngineSelect) {
    const searchEngine = event.target.value;
    localStorage.setItem('searchEngine', searchEngine);
    searchBar.setSearchEngine(searchEngine);
  }
});
 
// Add a new tab when the user clicks the new tab button
tabBarElement.addEventListener('click', (event) => {
  if (event.target.classList.contains('new-tab-button')) {
    tabManager.addTab();
  }
});
 
// Close a tab when the user clicks the close button
tabBarElement.addEventListener('click', (event) => {
  if (event.target.classList.contains('close-button')) {
    const tabId = event.target.dataset.tabId;
    tabManager.closeTab(tabId);
  }
});
 
// Update the tab title when the user changes it
tabBarElement.addEventListener('input', (event) => {
  if (event.target.classList.contains('tab-title')) {
    const tabId = event.target.dataset.tabId;
    const newTitle = event.target.value;
    tabManager.updateTabTitle(tabId, newTitle);
  }
});
 
// Make sure the active tab is updated when the user switches tabs
tabManager.onTabChange = (tab) => {
  const tabElements = tabBarElement.children;
  for (const tabElement of tabElements) {
    if (tabElement.dataset.tabId === tab.id) {
      tabElement.classList.add('active');
    } else {
      tabElement.classList.remove('active');
    }
  }
};
 
// Make sure the tab bar is updated when a tab is added or removed
tabManager.onTabAdd = (tab) => {
  const tabElement = document.createElement('div');
  tabElement.classList.add('tab');
  tabElement.dataset.tabId = tab.id;
  tabElement.innerHTML = `
    <span class="tab-title">${tab.title}</span>
    <button class="close-button" data-tab-id="${tab.id}">×</button>
  `;
  tabBarElement.appendChild(tabElement);
};
 
tabManager.onTabRemove = (tabId) => {
  const tabElement = tabBarElement.querySelector(`[data-tab-id="${tabId}"]`);
  tabElement.remove();
};
 
// Make sure the viewport is updated when a tab is added or removed
tabManager.onTabAdd = (tab) => {
  const iframeElement = document.createElement('iframe');
  iframeElement.src = tab.url;
  iframeElement.frameBorder = '0';
  iframeElement.allowFullscreen = true;
  viewportElement.appendChild(iframeElement);
};
 
tabManager.onTabRemove = (tabId) => {
  const iframeElement = viewportElement.querySelector(`[src="${tab.url}"]`);
  iframeElement.remove();
};
 
// Make sure the search bar is updated when the user navigates to a new URL
tabManager.onTabChange = (tab) => {
  searchBar.setSearchQuery(tab.url);
};
 
// Make sure the URL in the address bar is updated when the user navigates to a new URL
tabManager.onTabChange = (tab) => {
  const decodedUrl = decode(tab.url);
  history.pushState({}, '', decodedUrl);
};
 
// Add a loading indicator when the page is loading
viewportElement.addEventListener('load', () => {
  const loadingIndicator = document.createElement('div');
  loadingIndicator.classList.add('loading-indicator');
  viewportElement.appendChild(loadingIndicator);
});
 
// Remove the loading indicator when the page has finished loading
viewportElement.addEventListener('load', () => {
  const loadingIndicator = viewportElement.querySelector('.loading-indicator');
  loadingIndicator.remove();
});
 
// Make sure the settings panel is updated when the user changes a setting
settingsManager.onSettingsChange = (settings) => {
  localStorage.setItem('settings', JSON.stringify(settings));
};
 
// Make sure the settings are loaded when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const storedSettings = localStorage.getItem('settings');
  if (storedSettings) {
    const settings = JSON.parse(storedSettings);
    settingsManager.loadSettings(settings);
  }
});
 
// Make sure the history panel is updated when the user adds or removes a history entry
historyManager.onHistoryAdd = (entry) => {
  const historyElement = document.createElement('div');
  historyElement.classList.add('history-entry');
  historyElement.innerHTML = `
    <span class="history-title">${entry.title}</span>
    <span class="history-url">${entry.url}</span>
    <span class="history-date">${entry.date}</span>
  `;
  historyPanelElement.appendChild(historyElement);
};
 
historyManager.onHistoryRemove = (entry) => {
  const historyElement = historyPanelElement.querySelector(`[data-history-id="${entry.id}"]`);
  historyElement.remove();
};
 
// Make sure the bookmarks panel is updated when the user adds or removes a bookmark
bookmarksManager.onBookmarkAdd = (bookmark) => {
  const bookmarkElement = document.createElement('div');
  bookmarkElement.classList.add('bookmark');
  bookmarkElement.innerHTML = `
    <span class="bookmark-title">${bookmark.title}</span>
    <span class="bookmark-url">${bookmark.url}</span>
  `;
  bookmarksPanelElement.appendChild(bookmarkElement);
};
 
bookmarksManager.onBookmarkRemove = (bookmark) => {
  const bookmarkElement = bookmarksPanelElement.querySelector(`[data-bookmark-id="${bookmark.id}"]`);
  bookmarkElement.remove();
};