const { URL } = require('url');
const { CacheUtils } = require('./cache');
const { ValidationUtils } = require('./validation');

/**
 * Bookmark utility class for managing bookmarks.
 */
class BookmarkUtils {
  /**
   * Storage name for bookmarks.
   */
  static STORAGE_NAME = 'nexus-bookmarks';

  /**
   * IndexedDB database instance.
   */
  static db;

  /**
   * Opens the IndexedDB database and creates the bookmarks store if it doesn't exist.
   * @returns {Promise<void>}
   */
  static async openDB() {
    if (BookmarkUtils.db) return;

    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(BookmarkUtils.STORAGE_NAME, 1);

      request.onupgradeneeded = (event) => {
        BookmarkUtils.db = event.target.result;
        const bookmarksStore = BookmarkUtils.db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
        bookmarksStore.createIndex('title', 'title');
        bookmarksStore.createIndex('url', 'url');
      };

      request.onsuccess = (event) => {
        BookmarkUtils.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Adds a new bookmark to the database.
   * @param {string} title - The title of the bookmark.
   * @param {string} url - The URL of the bookmark.
   * @returns {Promise<void>}
   */
  static async addBookmark(title, url) {
    await BookmarkUtils.openDB();

    const validatedUrl = ValidationUtils.validateAndSanitizeUrl(url);

    return new Promise((resolve, reject) => {
      const transaction = BookmarkUtils.db.transaction(['bookmarks'], 'readwrite');
      const bookmarksStore = transaction.objectStore('bookmarks');
      const request = bookmarksStore.add({ title, url: validatedUrl });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Retrieves all bookmarks from the database.
   * @returns {Promise<Array<{ id: number, title: string, url: string }>>}
   */
  static async getBookmarks() {
    await BookmarkUtils.openDB();

    return new Promise((resolve, reject) => {
      const transaction = BookmarkUtils.db.transaction(['bookmarks'], 'readonly');
      const bookmarksStore = transaction.objectStore('bookmarks');
      const request = bookmarksStore.getAll();

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Updates a bookmark in the database.
   * @param {number} id - The ID of the bookmark to update.
   * @param {string} title - The new title of the bookmark.
   * @param {string} url - The new URL of the bookmark.
   * @returns {Promise<void>}
   */
  static async updateBookmark(id, title, url) {
    await BookmarkUtils.openDB();

    const validatedUrl = ValidationUtils.validateAndSanitizeUrl(url);

    return new Promise((resolve, reject) => {
      const transaction = BookmarkUtils.db.transaction(['bookmarks'], 'readwrite');
      const bookmarksStore = transaction.objectStore('bookmarks');
      const request = bookmarksStore.get(id);

      request.onsuccess = (event) => {
        const bookmark = event.target.result;
        if (bookmark) {
          bookmark.title = title;
          bookmark.url = validatedUrl;
          const updateRequest = bookmarksStore.put(bookmark);
          updateRequest.onsuccess = () => {
            resolve();
          };
          updateRequest.onerror = (updateEvent) => {
            reject(updateEvent.target.error);
          };
        } else {
          reject(new Error(`Bookmark with ID ${id} not found`));
        }
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  /**
   * Deletes a bookmark from the database.
   * @param {number} id - The ID of the bookmark to delete.
   * @returns {Promise<void>}
   */
  static async deleteBookmark(id) {
    await BookmarkUtils.openDB();

    return new Promise((resolve, reject) => {
      const transaction = BookmarkUtils.db.transaction(['bookmarks'], 'readwrite');
      const bookmarksStore = transaction.objectStore('bookmarks');
      const request = bookmarksStore.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
}

module.exports = BookmarkUtils;