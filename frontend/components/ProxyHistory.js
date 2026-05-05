import React, { useState, useEffect } from 'react';
import './ProxyHistory.css';

const openDB = async () => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('proxyHistoryDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const addHistoryEntry = async (entry) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.add(entry);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const getHistoryEntries = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['history'], 'readonly');
    const store = transaction.objectStore('history');
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const deleteHistoryEntry = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const clearHistory = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.clear();

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const ProxyHistory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const entries = await getHistoryEntries();
        setHistory(entries);
        setInitialized(true);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, [initialized]);

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const handleRemoveEntry = async (id) => {
    try {
      await deleteHistoryEntry(id);
      setHistory(history.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error('Error removing history entry:', error);
    }
  };

  const handleAddEntry = async (entry) => {
    try {
      await addHistoryEntry(entry);
    } catch (error) {
      console.error('Error adding history entry:', error);
    }
  };

  useEffect(() => {
    if (initialized) {
      const handleStorageChange = async () => {
        const entries = await getHistoryEntries();
        setHistory(entries);
      };

      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [initialized]);

  return (
    <div className={`proxy-history ${isOpen ? 'open' : ''}`}>
      <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        Proxy History
      </button>
      {isOpen && (
        <div className="history-container">
          <ul>
            {history.map((entry) => (
              <li key={entry.id}>
                <span>{entry.title}</span>
                <span>{entry.url}</span>
                <button onClick={() => handleRemoveEntry(entry.id)}>Remove</button>
              </li>
            ))}
          </ul>
          <button onClick={handleClearHistory}>Clear History</button>
        </div>
      )}
    </div>
  );
};

export default ProxyHistory;