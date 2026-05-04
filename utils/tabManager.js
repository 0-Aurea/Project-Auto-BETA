const { URL } = require('url');
const { Encoding } = require('./encoding');
const { SecurityUtils } = require('./securityUtils');

/**
 * Tab manager utility class for handling multiple tabs and their corresponding proxied pages.
 */
class TabManager {
  /**
   * Storage name for tab history.
   */
  static STORAGE_NAME = 'nexus-tab-history';

  /**
   * IndexedDB database instance.
   */
  static db;

  /**
   * Opens the IndexedDB database and creates the tab history store if it doesn't exist.
   * @returns {Promise<void>}
   */
  static async openDB() {
    if (TabManager.db) return;

    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(TabManager.STORAGE_NAME, 1);

      request.onupgradeneeded = (event) => {
        TabManager.db = event.target.result;
        TabManager.db.createObjectStore('tabHistory', { keyPath: 'id', autoIncrement: true });
      };

      request.onsuccess = (event) => {
        TabManager.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Adds a new tab to the tab history.
   * @param {string} title - The title of the tab.
   * @param {string} url - The URL of the tab.
   * @param {string} encodedUrl - The encoded URL of the tab.
   * @returns {Promise<void>}
   */
  static async addTab(title, url, encodedUrl) {
    await TabManager.openDB();

    return new Promise((resolve, reject) => {
      const transaction = TabManager.db.transaction('tabHistory', 'readwrite');
      const store = transaction.objectStore('tabHistory');

      const request = store.add({ title, url, encodedUrl });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Retrieves all tabs from the tab history.
   * @returns {Promise<Array<{ id: number, title: string, url: string, encodedUrl: string }>>}
   */
  static async getTabs() {
    await TabManager.openDB();

    return new Promise((resolve, reject) => {
      const transaction = TabManager.db.transaction('tabHistory', 'readonly');
      const store = transaction.objectStore('tabHistory');

      const request = store.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Updates a tab in the tab history.
   * @param {number} id - The ID of the tab to update.
   * @param {string} title - The new title of the tab.
   * @param {string} url - The new URL of the tab.
   * @param {string} encodedUrl - The new encoded URL of the tab.
   * @returns {Promise<void>}
   */
  static async updateTab(id, title, url, encodedUrl) {
    await TabManager.openDB();

    return new Promise((resolve, reject) => {
      const transaction = TabManager.db.transaction('tabHistory', 'readwrite');
      const store = transaction.objectStore('tabHistory');

      const request = store.get(id);

      request.onsuccess = (event) => {
        const tab = event.target.result;
        tab.title = title;
        tab.url = url;
        tab.encodedUrl = encodedUrl;

        const updateRequest = store.put(tab);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = (event) => {
          reject(event.target.error);
        };
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Removes a tab from the tab history.
   * @param {number} id - The ID of the tab to remove.
   * @returns {Promise<void>}
   */
  static async removeTab(id) {
    await TabManager.openDB();

    return new Promise((resolve, reject) => {
      const transaction = TabManager.db.transaction('tabHistory', 'readwrite');
      const store = transaction.objectStore('tabHistory');

      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Clears all tabs from the tab history.
   * @returns {Promise<void>}
   */
  static async clearTabs() {
    await TabManager.openDB();

    return new Promise((resolve, reject) => {
      const transaction = TabManager.db.transaction('tabHistory', 'readwrite');
      const store = transaction.objectStore('tabHistory');

      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
}

/**
 * Tab class representing a single tab with its corresponding proxied page.
 */
class Tab {
  /**
   * Creates a new Tab instance.
   * @param {string} id - The ID of the tab.
   * @param {string} title - The title of the tab.
   * @param {string} url - The URL of the tab.
   * @param {string} encodedUrl - The encoded URL of the tab.
   */
  constructor(id, title, url, encodedUrl) {
    this.id = id;
    this.title = title;
    this.url = url;
    this.encodedUrl = encodedUrl;
  }

  /**
   * Encodes the URL of the tab using the provided salt.
   * @param {string} salt - The salt to use for encoding.
   * @returns {string} The encoded URL.
   */
  encodeUrl(salt) {
    return SecurityUtils.xorEncode(this.url, salt);
  }

  /**
   * Decodes the URL of the tab using the provided salt.
   * @param {string} salt - The salt to use for decoding.
   * @returns {string} The decoded URL.
   */
  decodeUrl(salt) {
    return SecurityUtils.xorEncode(this.encodedUrl, salt);
  }
}

module.exports = { TabManager, Tab };