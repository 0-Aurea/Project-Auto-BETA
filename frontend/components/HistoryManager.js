import { openDB, deleteDB } from 'idb';

export class HistoryManager {
  constructor({ proxyHistoryPanelElement }) {
    this.proxyHistoryPanelElement = proxyHistoryPanelElement;
    this.dbName = 'historyDB';
    this.storeName = 'historyStore';
    this.dbVersion = 1;

    this.initDB = this.initDB.bind(this);
    this.addHistoryItem = this.addHistoryItem.bind(this);
    this.getHistoryItems = this.getHistoryItems.bind(this);
    this.deleteHistoryItem = this.deleteHistoryItem.bind(this);
    this.renderHistoryPanel = this.renderHistoryPanel.bind(this);

    this.initDB();
  }

  async initDB() {
    try {
      this.db = await openDB(this.dbName, this.dbVersion, {
        upgrade: (db) => {
          db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        },
      });

      this.renderHistoryPanel();
    } catch (error) {
      console.error('Error initializing history DB:', error);
    }
  }

  async addHistoryItem({ title, url, favicon }) {
    try {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.add({ title, url, favicon, timestamp: Date.now() });
      await request.done;
    } catch (error) {
      console.error('Error adding history item:', error);
    }
  }

  async getHistoryItems() {
    try {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.getAll();
      const historyItems = await request.done;
      return historyItems;
    } catch (error) {
      console.error('Error getting history items:', error);
      return [];
    }
  }

  async deleteHistoryItem(id) {
    try {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);
      await request.done;
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  }

  async renderHistoryPanel() {
    const historyItems = await this.getHistoryItems();
    this.proxyHistoryPanelElement.innerHTML = '';

    historyItems.forEach((item) => {
      const historyItemElement = document.createElement('div');
      historyItemElement.classList.add('history-item');

      const faviconElement = document.createElement('img');
      faviconElement.src = item.favicon;
      faviconElement.alt = 'Favicon';
      historyItemElement.appendChild(faviconElement);

      const titleElement = document.createElement('span');
      titleElement.textContent = item.title;
      historyItemElement.appendChild(titleElement);

      const urlElement = document.createElement('span');
      urlElement.textContent = item.url;
      historyItemElement.appendChild(urlElement);

      const timestampElement = document.createElement('span');
      timestampElement.textContent = this.formatRelativeTime(item.timestamp);
      historyItemElement.appendChild(timestampElement);

      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => this.deleteHistoryItem(item.id));
      historyItemElement.appendChild(deleteButton);

      this.proxyHistoryPanelElement.appendChild(historyItemElement);
    });
  }

  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 1000 * 60) {
      return 'less than 1 minute ago';
    } else if (diff < 1000 * 60 * 60) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 1000 * 60 * 60 * 24) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}