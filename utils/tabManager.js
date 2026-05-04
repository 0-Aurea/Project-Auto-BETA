class TabManager {
  /**
   * Tab bar state.
   */
  static tabState = {};

  /**
   * Active tab ID.
   */
  static activeTabId;

  /**
   * Tab history.
   */
  static tabHistory = {};

  /**
   * IndexedDB instance for storing proxy history.
   */
  static db;

  /**
   * Opens a new tab with the given URL.
   * @param {string} url - The URL to open in the new tab.
   * @param {string} title - The title of the new tab.
   * @returns {string} The ID of the new tab.
   */
  static openTab(url, title) {
    const tabId = Math.random().toString(36).substr(2, 9);
    TabManager.tabState[tabId] = { url, title };
    TabManager.activeTabId = tabId;
    TabManager.tabHistory[tabId] = [];
    return tabId;
  }

  /**
   * Closes a tab with the given ID.
   * @param {string} tabId - The ID of the tab to close.
   */
  static closeTab(tabId) {
    delete TabManager.tabState[tabId];
    if (TabManager.activeTabId === tabId) {
      TabManager.activeTabId = null;
    }
  }

  /**
   * Updates the URL of a tab with the given ID.
   * @param {string} tabId - The ID of the tab to update.
   * @param {string} url - The new URL of the tab.
   */
  static updateTabUrl(tabId, url) {
    if (TabManager.tabState[tabId]) {
      TabManager.tabState[tabId].url = url;
    }
  }

  /**
   * Gets the current tab state.
   * @returns {object} The current tab state.
   */
  static getTabState() {
    return TabManager.tabState;
  }

  /**
   * Initializes the IndexedDB instance for storing proxy history.
   */
  static async initHistoryDB() {
    if (!TabManager.db) {
      TabManager.db = await openDB('proxy-history', 1, {
        upgrade: (db) => {
          db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        },
      });
    }
  }

  /**
   * Adds a new entry to the proxy history.
   * @param {string} tabId - The ID of the tab.
   * @param {string} url - The URL of the proxied resource.
   */
  static async addHistoryEntry(tabId, url) {
    if (TabManager.db) {
      const tx = TabManager.db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      await store.add({ tabId, url });
    }
  }

  /**
   * Clears the proxy history for a given tab.
   * @param {string} tabId - The ID of the tab.
   */
  static async clearHistory(tabId) {
    if (TabManager.db) {
      const tx = TabManager.db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      await store.delete(tabId);
    }
  }
}

async function openDB(name, version, upgradeCallback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = (e) => upgradeCallback(e.target.result);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}