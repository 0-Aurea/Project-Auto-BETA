import React, { useState, useEffect } from 'react';
import './BookmarksManager.css';

const BookmarksManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    const storedBookmarks = localStorage.getItem('bookmarks');
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  });
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkURL, setNewBookmarkURL] = useState('');
  const [editBookmarkId, setEditBookmarkId] = useState(null);
  const [editedBookmarkTitle, setEditedBookmarkTitle] = useState('');
  const [editedBookmarkURL, setEditedBookmarkURL] = useState('');

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAddBookmark = (e) => {
    e.preventDefault();
    if (newBookmarkTitle && newBookmarkURL) {
      const newBookmark = {
        id: Date.now(),
        title: newBookmarkTitle,
        url: newBookmarkURL,
      };
      setBookmarks([...bookmarks, newBookmark]);
      setNewBookmarkTitle('');
      setNewBookmarkURL('');
    }
  };

  const handleRemoveBookmark = (id) => {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id));
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
      setBookmarks(
        bookmarks.map((bookmark) =>
          bookmark.id === editBookmarkId
            ? { ...bookmark, title: editedBookmarkTitle, url: editedBookmarkURL }
            : bookmark
        )
      );
      setEditBookmarkId(null);
      setEditedBookmarkTitle('');
      setEditedBookmarkURL('');
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
                    <input
                      type="text"
                      value={bookmark.title}
                      readOnly
                    />
                    <input
                      type="text"
                      value={bookmark.url}
                      readOnly
                    />
                  </>
                )}
                {editBookmarkId !== bookmark.id && (
                  <>
                    <button onClick={() => handleEditBookmark(bookmark.id)}>
                      Edit
                    </button>
                    <button onClick={() => handleRemoveBookmark(bookmark.id)}>
                      Remove
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