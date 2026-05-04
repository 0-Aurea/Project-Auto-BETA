import React from 'react';
import ReactDOM from 'react-dom';
import SettingsPanel from './components/SettingsPanel';
import SearchBar from './components/SearchBar';
import TabBar from './components/TabBar';
import ProxyHistory from './components/ProxyHistory';
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

// Initialize service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then((registration) => {
      console.log('Service worker registered:', registration);
    })
    .catch((error) => {
      console.error('Error registering service worker:', error);
    });
} else {
  console.log('Service worker not supported');
}

// Initialize IndexedDB
const initIndexedDB = async () => {
  try {
    const db = await idb.openDb('nexus-proxy', 1, {
      upgrade: (db) => {
        db.createObjectStore('proxy-history');
      }
    });
    const tx = db.transaction('proxy-history', 'readwrite');
    const store = tx.objectStore('proxy-history');
    // Initialize store
  } catch (e) {
    console.error('Error initializing IndexedDB:', e);
  }
};
initIndexedDB();