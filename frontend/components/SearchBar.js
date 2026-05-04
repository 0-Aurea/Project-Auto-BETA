import React, { useState, useEffect } from 'react';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();
    const searchValue = searchQuery.trim();
    if (searchValue) {
      // Implement search logic here
      console.log(`Searching for: ${searchValue}`);
      // Call the proxy service to handle the search query
      fetch('/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchValue }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          // Handle the response data
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value.length > 0) {
      setShowSuggestions(true);
      // Fetch suggestions from the proxy service
      fetch('/suggestions', {
        method: 'GET',
      })
        .then((response) => response.json())
        .then((data) => {
          setSuggestions(data);
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      setShowSuggestions(false);
    }
  };

  const handleFocus = () => {
    setFocused(true);
  };

  const handleBlur = () => {
    setFocused(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
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
        {showSuggestions && (
          <ul className="suggestions">
            {suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </li>
            ))}
          </ul>
        )}
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