import React, { useState, useEffect } from 'react';
import './BookmarksManager.css';

const openDB = async () => {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open('bookmarksDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

const addBookmark = async (bookmark) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bookmarks'], 'readwrite');
    const store = transaction.objectStore('bookmarks');
    const request = store.add(bookmark);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

const getAllBookmarks = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bookmarks'], 'readonly');
    const store = transaction.objectStore('bookmarks');
    const request = store.getAll();
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const updateBookmark = async (id, bookmark) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bookmarks'], 'readwrite');
    const store = transaction.objectStore('bookmarks');
    const request = store.put(bookmark);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

const deleteBookmark = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['bookmarks'], 'readwrite');
    const store = transaction.objectStore('bookmarks');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
};

const BookmarksManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkURL, setNewBookmarkURL] = useState('');
  const [editBookmarkId, setEditBookmarkId] = useState(null);
  const [editedBookmarkTitle, setEditedBookmarkTitle] = useState('');
  const [editedBookmarkURL, setEditedBookmarkURL] = useState('');

  useEffect(() => {
    const fetchBookmarks = async () => {
      const storedBookmarks = await getAllBookmarks();
      setBookmarks(storedBookmarks);
    };
    fetchBookmarks();
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAddBookmark = (e) => {
    e.preventDefault();
    if (newBookmarkTitle && newBookmarkURL) {
      const newBookmark = {
        title: newBookmarkTitle,
        url: newBookmarkURL,
      };
      addBookmark(newBookmark).then(() => {
        setNewBookmarkTitle('');
        setNewBookmarkURL('');
        getAllBookmarks().then((bookmarks) => setBookmarks(bookmarks));
      });
    }
  };

  const handleRemoveBookmark = (id) => {
    deleteBookmark(id).then(() => {
      getAllBookmarks().then((bookmarks) => setBookmarks(bookmarks));
    });
  };

  const handleEditBookmark = (id) => {
    const bookmark = bookmarks.find((bookmark) => bookmark.id === id);
    if (bookmark) {
      setEditBookmarkId(id);
      setEditedBookmarkTitle(bookmark.title);
      setEditedBookmarkURL(bookmark.url);
    }
  };

  const handleSaveEditedBookmark = (e) => {
    e.preventDefault();
    if (editBookmarkId) {
      const updatedBookmark = {
        id: editBookmarkId,
        title: editedBookmarkTitle,
        url: editedBookmarkURL,
      };
      updateBookmark(editBookmarkId, updatedBookmark).then(() => {
        setEditBookmarkId(null);
        setEditedBookmarkTitle('');
        setEditedBookmarkURL('');
        getAllBookmarks().then((bookmarks) => setBookmarks(bookmarks));
      });
    }
  };

  const handleCancelEditing = () => {
    setEditBookmarkId(null);
    setEditedBookmarkTitle('');
    setEditedBookmarkURL('');
  };

  return (
    <div className="bookmarks-manager">
      <button className="toggle-button" onClick={handleToggle}>
        {isOpen ? 'Close Bookmarks' : 'Bookmarks'}
      </button>
      {isOpen && (
        <div className="bookmarks-list">
          <h2>Bookmarks</h2>
          <ul>
            {bookmarks.map((bookmark) => (
              <li key={bookmark.id}>
                {editBookmarkId === bookmark.id ? (
                  <form onSubmit={handleSaveEditedBookmark}>
                    <input
                      type="text"
                      value={editedBookmarkTitle}
                      onChange={(e) => setEditedBookmarkTitle(e.target.value)}
                      placeholder="Bookmark title"
                    />
                    <input
                      type="text"
                      value={editedBookmarkURL}
                      onChange={(e) => setEditedBookmarkURL(e.target.value)}
                      placeholder="Bookmark URL"
                    />
                    <button type="submit">Save</button>
                    <button type="button" onClick={handleCancelEditing}>
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span>{bookmark.title}</span>
                    <span>{bookmark.url}</span>
                    <button onClick={() => handleEditBookmark(bookmark.id)}>
                      Edit
                    </button>
                    <button onClick={() => handleRemoveBookmark(bookmark.id)}>
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddBookmark}>
            <input
              type="text"
              value={newBookmarkTitle}
              onChange={(e) => setNewBookmarkTitle(e.target.value)}
              placeholder="Bookmark title"
            />
            <input
              type="text"
              value={newBookmarkURL}
              onChange={(e) => setNewBookmarkURL(e.target.value)}
              placeholder="Bookmark URL"
            />
            <button type="submit">Add Bookmark</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookmarksManager;