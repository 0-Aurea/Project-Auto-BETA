import React from 'react';
import ReactDOM from 'react-dom';
import SettingsPanel from './components/SettingsPanel';
import SearchBar from './components/SearchBar';
import TabBar from './components/TabBar';
import ProxyHistory from './components/ProxyHistory';
import BookmarksManager from './components/BookmarksManager';
import './style.css';

const App = () => {
  return (
    <div className="container">
      <header>
        <nav>
          <ul>
            <li><a href="#" id="settings-toggle">Settings</a></li>
            <li><a href="#" id="bookmarks-toggle">Bookmarks</a></li>
            <li><a href="#" id="proxy-history-toggle">Proxy History</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <SearchBar 
          onSearch={(searchTerm) => createTab(searchTerm)}
        />
        <TabBar 
          onSwitchTab={(tab) => switchToTab(tab)}
          onCreateTab={(searchTerm) => createTab(searchTerm)}
        />
        <div id="tab-content"></div>
      </main>
      <SettingsPanel />
      <ProxyHistory />
      <BookmarksManager />
    </div>
  );
};

ReactDOM.render(<App />, document.body);

let currentTab = null;
let tabs = [];
let bookmarks = [];
let settings = {
  encodingMode: 'xor-base64',
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
    };
    await tx.done;
  } catch (e) {
    console.error('Error loading bookmarks:', e);
  }
};
openDB();

// Render tab bar
const renderTabBar = () => {
  const tabBar = document.getElementById('tab-bar');
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
  // Communicate with the Service Worker to load the tab's URL
  navigator.serviceWorker.controller.postMessage({ type: 'load-url', url: tab.url });
};

// Create new tab
const createTab = async (searchTerm) => {
  const tab = {
    id: Date.now(),
    title: searchTerm,
    content: `Searching for ${searchTerm}...`,
    url: `https://www.google.com/search?q=${searchTerm}`
  };
  tabs.push(tab);
  renderTabBar();
  switchToTab(tab);
};

// Handle tab updates
const updateTab = (tab) => {
  const index = tabs.findIndex((t) => t.id === tab.id);
  if (index !== -1) {
    tabs[index] = tab;
    renderTabBar();
  }
};

// Delete tab
const deleteTab = (tabId) => {
  const index = tabs.findIndex((t) => t.id === tabId);
  if (index !== -1) {
    tabs.splice(index, 1);
    renderTabBar();
  }
};

// Handle messages from the Service Worker
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'tab-update') {
    updateTab(event.data.tab);
  } else if (event.data.type === 'tab-delete') {
    deleteTab(event.data.tabId);
  }
});

// Initialize the Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
} else {
  console.error('Service Worker is not supported');
}

// Proxy engine connection
const proxyEngine = {
  async loadUrl(url) {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Proxy-Engine': 'Nexus'
        }
      });
      return await response.text();
    } catch (error) {
      console.error('Error loading URL:', error);
    }
  }
};

// Communicate with the proxy engine to load URLs
const loadUrl = async (url) => {
  const content = await proxyEngine.loadUrl(url);
  document.getElementById('tab-content').innerHTML = content;
};

// Add event listener to the search bar
document.getElementById('search-bar').addEventListener('submit', (event) => {
  event.preventDefault();
  const searchTerm = document.getElementById('search-input').value;
  createTab(searchTerm);
});

// Add event listener to the settings toggle
document.getElementById('settings-toggle').addEventListener('click', () => {
  document.getElementById('settings-panel').classList.toggle('open');
});

// Add event listener to the bookmarks toggle
document.getElementById('bookmarks-toggle').addEventListener('click', () => {
  document.getElementById('bookmarks-manager').classList.toggle('open');
});

// Add event listener to the proxy history toggle
document.getElementById('proxy-history-toggle').addEventListener('click', () => {
  document.getElementById('proxy-history').classList.toggle('open');
});