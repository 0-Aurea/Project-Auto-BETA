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
    bookmarksReq.onsuccess = () => {
      bookmarks = bookmarksReq.result;
    };
    await tx.done;
  } catch (e) {
    console.error('Error loading bookmarks:', e);
  }
};
openDB();

// Search bar input event handler
searchInput.addEventListener('input', () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    searchButton.disabled = false;
  } else {
    searchButton.disabled = true;
  }
});

// Search button click event handler
searchButton.addEventListener('click', async () => {
  const searchTerm = searchInput.value.trim();
  if (searchTerm) {
    const tab = await createTab(searchTerm);
    tabs.push(tab);
    renderTabBar();
    switchToTab(tab);
  }
});

// Settings toggle click event handler
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('visible');
});

// Bookmarks toggle click event handler
bookmarksToggle.addEventListener('click', () => {
  bookmarksPanel.classList.toggle('visible');
});

// Ad block toggle change event handler
adBlockToggle.addEventListener('change', () => {
  settings.adBlockEnabled = adBlockToggle.checked;
  localStorage.setItem('nexus-settings', JSON.stringify(settings));
});

// Cache toggle change event handler
cacheToggle.addEventListener('change', () => {
  settings.cacheEnabled = cacheToggle.checked;
  localStorage.setItem('nexus-settings', JSON.stringify(settings));
});

// Encoding mode select change event handler
encodingModeSelect.addEventListener('change', () => {
  settings.encodingMode = encodingModeSelect.value;
  localStorage.setItem('nexus-settings', JSON.stringify(settings));
});

// Tab bar click event handler
tabBar.addEventListener('click', (e) => {
  if (e.target.classList.contains('tab')) {
    const tabId = e.target.dataset.tabId;
    switchToTab(tabs.find((tab) => tab.id === tabId));
  } else if (e.target.classList.contains('close-button')) {
    const tabId = e.target.dataset.tabId;
    const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex !== -1) {
      tabs.splice(tabIndex, 1);
      renderTabBar();
      if (tabs.length > 0) {
        switchToTab(tabs[0]);
      }
    }
  }
});

// Create a new tab
const createTab = async (searchTerm) => {
  const tabId = Math.random().toString(36).substr(2, 9);
  const tab = {
    id: tabId,
    searchTerm,
    url: `https://www.google.com/search?q=${searchTerm}`,
    iframe: document.createElement('iframe')
  };
  tab.iframe.src = tab.url;
  tab.iframe.frameBorder = '0';
  tab.iframe.width = '100%';
  tab.iframe.height = '100vh';
  return tab;
};

// Render the tab bar
const renderTabBar = () => {
  tabBar.innerHTML = '';
  tabs.forEach((tab) => {
    const tabElement = document.createElement('div');
    tabElement.classList.add('tab');
    tabElement.dataset.tabId = tab.id;
    tabElement.innerHTML = `
      <span>${tab.searchTerm}</span>
      <button class="close-button" data-tab-id="${tab.id}">Close</button>
    `;
    tabBar.appendChild(tabElement);
  });
};

// Switch to a tab
const switchToTab = (tab) => {
  if (currentTab) {
    currentTab.iframe.style.display = 'none';
  }
  currentTab = tab;
  currentTab.iframe.style.display = 'block';
  document.body.appendChild(currentTab.iframe);
};

// Initialize UI
(() => {
  adBlockToggle.checked = settings.adBlockEnabled;
  cacheToggle.checked = settings.cacheEnabled;
  encodingModeSelect.value = settings.encodingMode;
  renderTabBar();
  if (tabs.length > 0) {
    switchToTab(tabs[0]);
  }
})();