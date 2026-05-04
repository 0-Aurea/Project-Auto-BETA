const { openDB, deleteDB } = require('./idbUtils');

/**
 * Proxy history utility class for managing proxy history.
 */
class ProxyHistory {
  /**
   * IndexedDB database instance for storing proxy history.
   */
  static db;

  /**
   * IndexedDB database name for storing proxy history.
   */
  static DB_NAME = 'proxyHistory';

  /**
   * IndexedDB object store name for storing proxy history.
   */
  static OBJECT_STORE_NAME = 'history';

  /**
   * Initialize the proxy history utility.
   */
  static async init() {
    ProxyHistory.db = await openDB(ProxyHistory.DB_NAME, ProxyHistory.OBJECT_STORE_NAME);
  }

  /**
   * Adds a new entry to the proxy history.
   * @param {string} title - The title of the page.
   * @param {string} url - The URL of the page.
   * @param {string} icon - The icon of the page.
   */
  static async addEntry(title, url, icon) {
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    await store.add({ title, url, icon, timestamp: Date.now() });
  }

  /**
   * Retrieves all entries from the proxy history.
   * @returns {Promise<Array>} An array of proxy history entries.
   */
  static async getAllEntries() {
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieves an entry from the proxy history by its URL.
   * @param {string} url - The URL of the page.
   * @returns {Promise<*>} A proxy history entry.
   */
  static async getEntryByUrl(url) {
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    const request = store.get(url);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Updates an entry in the proxy history.
   * @param {string} url - The URL of the page.
   * @param {object} data - The updated data.
   */
  static async updateEntry(url, data) {
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    const request = store.get(url);
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const entry = request.result;
        if (entry) {
          Object.assign(entry, data);
          await store.put(entry);
          resolve();
        } else {
          reject(new Error(`Entry not found: ${url}`));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes an entry from the proxy history by its URL.
   * @param {string} url - The URL of the page.
   */
  static async deleteEntry(url) {
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    await store.delete(url);
  }

  /**
   * Clears the entire proxy history.
   */
  static async clearHistory() {
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    await store.clear();
  }
}

// Initialize the proxy history utility
ProxyHistory.init();

module.exports = ProxyHistory;