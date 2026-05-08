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
    if (ProxyHistory.db) {
      return;
    }
    try {
      ProxyHistory.db = await openDB(ProxyHistory.DB_NAME, ProxyHistory.OBJECT_STORE_NAME, {
        keyPath: 'url',
        autoIncrement: false,
      });
    } catch (error) {
      console.error('Error initializing proxy history:', error);
      throw error;
    }
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
    if (!ProxyHistory.db) {
      await ProxyHistory.init();
    }
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    try {
      await store.add({ title, url, icon, timestamp: Date.now() });
      await tx.done;
    } catch (error) {
      console.error('Error adding entry to proxy history:', error);
      throw error;
    }
  }

  /**
   * Retrieves all entries from the proxy history.
   * @returns {Promise<Array>} An array of proxy history entries.
   */
  static async getAllEntries() {
    if (!ProxyHistory.db) {
      return [];
    }
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    try {
      const request = store.getAll();
      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await tx.done;
      return result;
    } catch (error) {
      console.error('Error retrieving all entries from proxy history:', error);
      throw error;
    }
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
    if (!ProxyHistory.db) {
      return null;
    }
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    try {
      const request = store.get(url);
      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await tx.done;
      return result;
    } catch (error) {
      console.error('Error retrieving entry from proxy history:', error);
      throw error;
    }
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
    if (!ProxyHistory.db) {
      return;
    }
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    try {
      const request = store.get(url);
      const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      if (result) {
        Object.assign(result, data);
        await store.put(result);
        await tx.done;
      } else {
        throw new Error(`Entry not found for URL: ${url}`);
      }
    } catch (error) {
      console.error('Error updating entry in proxy history:', error);
      throw error;
    }
  }

  /**
   * Removes an entry from the proxy history by its URL.
   * @param {string} url - The URL of the page.
   */
  static async removeEntry(url) {
    if (!url) {
      throw new Error('URL is required');
    }
    if (!ProxyHistory.db) {
      return;
    }
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    try {
      await store.delete(url);
      await tx.done;
    } catch (error) {
      console.error('Error removing entry from proxy history:', error);
      throw error;
    }
  }

  /**
   * Clears all entries from the proxy history.
   */
  static async clearHistory() {
    if (!ProxyHistory.db) {
      return;
    }
    const tx = ProxyHistory.db.transaction(ProxyHistory.OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(ProxyHistory.OBJECT_STORE_NAME);
    try {
      await store.clear();
      await tx.done;
    } catch (error) {
      console.error('Error clearing proxy history:', error);
      throw error;
    }
  }

  /**
   * Closes the IndexedDB database instance.
   */
  static async closeDB() {
    if (ProxyHistory.db) {
      ProxyHistory.db.close();
      ProxyHistory.db = null;
    }
  }

  /**
   * Deletes the IndexedDB database instance.
   */
  static async deleteDBInstance() {
    await deleteDB(ProxyHistory.DB_NAME);
  }
}

module.exports = ProxyHistory;