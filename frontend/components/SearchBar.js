import React, { useState, useEffect } from 'react';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();
    const searchInput = document.getElementById('search-input');
    const searchValue = searchInput.value.trim();
    if (searchValue) {
      // Implement search logic here
      console.log(`Searching for: ${searchValue}`);
    }
  };

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch}>
        <input
          type="search"
          id="search-input"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={focused ? 'focused' : ''}
        />
        <button id="search-button" type="submit">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M16.32 14.9l5.39 5.4a1 1 0 0 1-1.42 1.4l-5.38-5.38a8 8 0 1 1 1.41-1.41zM10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default SearchBar;