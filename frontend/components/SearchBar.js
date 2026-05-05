import React, { useState, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = ({ onSearchQuery }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const storedHistory = localStorage.getItem('searchHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [searchEngine, setSearchEngine] = useState(() => {
    const storedEngine = localStorage.getItem('searchEngine');
    return storedEngine ? storedEngine : 'google';
  });
  const [bookmarks, setBookmarks] = useState(() => {
    const storedBookmarks = localStorage.getItem('bookmarks');
    return storedBookmarks ? JSON.parse(storedBookmarks) : [];
  });

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    localStorage.setItem('searchEngine', searchEngine);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [searchHistory, searchEngine, bookmarks]);

  const handleSearch = (event) => {
    event.preventDefault();
    const searchValue = searchQuery.trim();
    if (searchValue) {
      const updatedHistory = [...searchHistory, searchValue];
      setSearchHistory(updatedHistory);
      setSearchQuery('');
      onSearchQuery(searchValue);
      const url = searchEngine === 'google' ? 'https://www.google.com/search' : 'https://www.bing.com/search';
      const params = new URLSearchParams({
        q: searchValue,
      });
      // Connect to the proxy engine
      fetch('/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${url}?${params.toString()}`,
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          window.open(data.url, '_blank');
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
      const filteredSuggestions = [...searchHistory, ...bookmarks];
      const filtered = filteredSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(event.target.value.toLowerCase()));
      setSuggestions(filtered);
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

  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem);
  };

  const handleHistoryClear = () => {
    setSearchHistory([]);
  };

  const handleHistoryToggle = () => {
    setHistoryExpanded(!historyExpanded);
  };

  const handleSearchEngineChange = (event) => {
    setSearchEngine(event.target.value);
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch}>
        <input
          type="search"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search"
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
        <button type="submit">Search</button>
      </form>
      <div className="search-history">
        <h2>Search History</h2>
        <ul>
          {searchHistory.map((historyItem, index) => (
            <li key={index}>
              <span onClick={() => handleHistoryClick(historyItem)}>{historyItem}</span>
              <button onClick={() => setSearchHistory(searchHistory.filter((item) => item !== historyItem))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <button onClick={handleHistoryClear}>Clear History</button>
        <button onClick={handleHistoryToggle}>{historyExpanded ? 'Hide' : 'Show'} History</button>
      </div>
      <div className="search-engine">
        <select value={searchEngine} onChange={handleSearchEngineChange}>
          <option value="google">Google</option>
          <option value="bing">Bing</option>
        </select>
      </div>
    </div>
  );
};

export default SearchBar;