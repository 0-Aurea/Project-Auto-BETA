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
  try {
    const response = await fetch(tab.url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();
    tab.content = html;
  } catch (e) {
    tab.content = `Error loading ${searchTerm}: ${e.message}`;
  }
  return tab;
};

// Render settings panel
const renderSettingsPanel = () => {
  adBlockToggle.checked = settings.adBlockEnabled;
  cacheToggle.checked = settings.cacheEnabled;
  encodingModeSelect.value = settings.encodingMode;
};

// Render bookmarks panel
const renderBookmarksPanel = () => {
  const bookmarksList = document.getElementById('bookmarks-list');
  bookmarksList.innerHTML = '';
  bookmarks.forEach((bookmark) => {
    const bookmarkItem = document.createElement('li');
    bookmarkItem.textContent = bookmark.title;
    bookmarkItem.addEventListener('click', () => {
      switchToTab(bookmark);
    });
    bookmarksList.appendChild(bookmarkItem);
  });
};

// Add event listeners
searchButton.addEventListener('click', async () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    const tab = await createTab(searchTerm);
    tabs.push(tab);
    renderTabBar();
    switchToTab(tab);
    searchInput.value = '';
  }
});

settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('visible');
});

bookmarksToggle.addEventListener('click', () => {
  bookmarksPanel.classList.toggle('visible');
});

adBlockToggle.addEventListener('change', (e) => {
  settings.adBlockEnabled = e.target.checked;
  localStorage.setItem('nexus-settings', JSON.stringify(settings));
});

cacheToggle.addEventListener('change', (e) => {
  settings.cacheEnabled = e.target.checked;
  localStorage.setItem('nexus-settings', JSON.stringify(settings));
});

encodingModeSelect.addEventListener('change', (e) => {
  settings.encodingMode = e.target.value;
  localStorage.setItem('nexus-settings', JSON.stringify(settings));
});

// Initialize UI
renderSettingsPanel();
renderTabBar();

// Prefetch hints
const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
prefetchLinks.forEach((link) => {
  const url = link.href;
  fetch(url)
    .then((response) => response.ok && response)
    .catch((e) => console.error('Prefetch error:', e));
});

// Bookmark management
const addBookmark = async (tab) => {
  try {
    const db = await idb.openDb('nexus-bookmarks', 1);
    const tx = db.transaction('bookmarks', 'readwrite');
    const store = tx.objectStore('bookmarks');
    await store.add({ title: tab.title, url: tab.url });
    bookmarks.push(tab);
    renderBookmarksPanel();
    await tx.done;
  } catch (e) {
    console.error('Error adding bookmark:', e);
  }
};

const removeBookmark = async (tab) => {
  try {
    const db = await idb.openDb('nexus-bookmarks', 1);
    const tx = db.transaction('bookmarks', 'readwrite');
    const store = tx.objectStore('bookmarks');
    await store.delete(tab.url);
    bookmarks = bookmarks.filter((bookmark) => bookmark.url !== tab.url);
    renderBookmarksPanel();
    await tx.done;
  } catch (e) {
    console.error('Error removing bookmark:', e);
  }
};

// Tab context menu
document.getElementById('tab-content').addEventListener('contextmenu', (e) => {
  e.preventDefault();
  const menu = document.getElementById('context-menu');
  menu.style.top = `${e.clientY}px`;
  menu.style.left = `${e.clientX}px`;
  menu.classList.add('visible');
});

// Close context menu
document.addEventListener('click', () => {
  const menu = document.getElementById('context-menu');
  menu.classList.remove('visible');
});

// Tab actions
document.getElementById('close-tab').addEventListener('click', () => {
  if (currentTab) {
    tabs = tabs.filter((tab) => tab.url !== currentTab.url);
    renderTabBar();
    if (tabs.length > 0) {
      switchToTab(tabs[0]);
    }
  }
});

document.getElementById('add-bookmark').addEventListener('click', () => {
  if (currentTab) {
    addBookmark(currentTab);
  }
});

document.getElementById('remove-bookmark').addEventListener('click', () => {
  if (currentTab) {
    removeBookmark(currentTab);
  }
});