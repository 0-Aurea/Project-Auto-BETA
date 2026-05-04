import React, { useState, useEffect } from 'react';

const BookmarksManager = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(() => {
    const storedBookmarks = localStorage.getItem('bookmarks');
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  });
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkURL, setNewBookmarkURL] = useState('');

  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleAddBookmark = () => {
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

  const handleEditBookmark = (id, title, url) => {
    setBookmarks(
      bookmarks.map((bookmark) =>
        bookmark.id === id ? { ...bookmark, title, url } : bookmark
      )
    );
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
                <input
                  type="text"
                  value={bookmark.title}
                  onChange={(e) =>
                    handleEditBookmark(bookmark.id, e.target.value, bookmark.url)
                  }
                />
                <input
                  type="text"
                  value={bookmark.url}
                  onChange={(e) =>
                    handleEditBookmark(bookmark.id, bookmark.title, e.target.value)
                  }
                />
                <button onClick={() => handleRemoveBookmark(bookmark.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <form>
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
            <button onClick={handleAddBookmark}>Add Bookmark</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookmarksManager;