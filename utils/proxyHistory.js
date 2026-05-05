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
    ProxyHistory.db = await openDB(ProxyHistory.DB_NAME, ProxyHistory.OBJECT_STORE_NAME, {
      keyPath: 'url',
      autoIncrement: false,
    });
  }

  /**
   * Adds a new entry to the proxy history.
   * @param {string} title - The title of the page.
   * @param {string} url - The URL of the page.
   * @param {string} icon - The icon of the page.
   */
  static async addEntry(title, url, icon) {
    if (!title || !url || !icon) {
      throw new Error('Title, URL, and icon are required');
    }
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
    if (!url) {
      throw new Error('URL is required');
    }
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
    if (!url || !data) {
      throw new Error('URL and data are required');
    }
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
          reject(new Error(`Entry not found for URL: ${url}`));
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
    if (!url) {
      throw new Error('URL is required');
    }
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    await store.delete(url);
  }

  /**
   * Clears all entries from the proxy history.
   */
  static async clearAllEntries() {
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    await store.clear();
  }
}

module.exports = ProxyHistory;