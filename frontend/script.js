import React from 'react';
import ReactDOM from 'react-dom';
import SettingsPanel from './components/SettingsPanel';
import SearchBar from './components/SearchBar';
import TabBar from './components/TabBar';
import './style.css';

const App = () => {
  return (
    <div className="container">
      <header>
        <nav>
          <ul>
            <li><a href="#" id="settings-toggle">Settings</a></li>
            <li><a href="#" id="bookmarks-toggle">Bookmarks</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <SearchBar />
        <TabBar />
        <div id="tab-content"></div>
      </main>
      <SettingsPanel />
    </div>
  );
};

ReactDOM.render(<App />, document.body);

const settingsPanel = document.getElementById('settings-panel');
const bookmarksPanel = document.getElementById('bookmarks-panel');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const tabBar = document.getElementById('tab-bar');
const settingsToggle = document.getElementById('settings-toggle');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const adBlockToggle = document.getElementById('ad-block-toggle');
const cacheToggle = document.getElementById('cache-toggle');
const encodingModeSelect = document.getElementById('encoding-mode-select');

let currentTab = null;
let tabs = [];
let bookmarks = [];
let settings = {
  encodingMode: 'base64',
  adBlockEnabled: true,
  cacheEnabled: true
};

// Load settings from local storage
try {
  const storedSettings = JSON.parse(localStorage.getItem('nexus-settings'));
  if (storedSettings) {
    settings = storedSettings;
  }
} catch (e) {
  console.error('Error loading settings:', e);
}

// Load bookmarks from IndexedDB
const openDB = async () => {
  try {
    const db = await idb.openDb('nexus-bookmarks', 1, {
      upgrade: (db) => {
        db.createObjectStore('bookmarks');
      }
    });
    const tx = db.transaction('bookmarks', 'readonly');
    const store = tx.objectStore('bookmarks');
    const bookmarksReq = store.getAll();
    bookmarksReq.onsuccess = (event) => {
      bookmarks = event.target.result;
      renderBookmarksPanel();
    };
    await tx.done;
  } catch (e) {
    console.error('Error loading bookmarks:', e);
  }
};
openDB();

// Render tab bar
const renderTabBar = () => {
  tabBar.innerHTML = '';
  tabs.forEach((tab, index) => {
    const tabButton = document.createElement('button');
    tabButton.textContent = tab.title;
    tabButton.addEventListener('click', () => {
      switchToTab(tab);
    });
    tabBar.appendChild(tabButton);
  });
};

// Switch to tab
const switchToTab = (tab) => {
  currentTab = tab;
  document.getElementById('tab-content').innerHTML = tab.content;
};

// Create new tab
const createTab = async (searchTerm) => {
  const tab = {
    title: searchTerm,
    content: `Searching for ${searchTerm}...`,
    url: `https://www.google.com/search?q=${searchTerm}`
  };
  tabs.push(tab);
  renderTabBar();
  switchToTab(tab);
};

// Add event listeners
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('open');
});

bookmarksToggle.addEventListener('click', () => {
  bookmarksPanel.classList.toggle('open');
});

searchButton.addEventListener('click', () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    createTab(searchTerm);
  }
});

// Initialize UI
renderTabBar();

// Dark mode toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

// Load dark mode setting
try {
  const storedDarkMode = localStorage.getItem('darkMode');
  if (storedDarkMode === 'true') {
    document.body.classList.add('dark-mode');
  }
} catch (e) {
  console.error('Error loading dark mode setting:', e);
}

// Render bookmarks panel
const renderBookmarksPanel = () => {
  bookmarksPanel.innerHTML = '';
  bookmarks.forEach((bookmark) => {
    const bookmarkElement = document.createElement('div');
    bookmarkElement.textContent = bookmark.title;
    bookmarksPanel.appendChild(bookmarkElement);
  });
};

// Add bookmark
const addBookmark = (tab) => {
  const bookmark = {
    title: tab.title,
    url: tab.url
  };
  bookmarks.push(bookmark);
  renderBookmarksPanel();
};

// Remove bookmark
const removeBookmark = (bookmark) => {
  bookmarks = bookmarks.filter((b) => b !== bookmark);
  renderBookmarksPanel();
};