import React, { useState, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = () => {
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

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    localStorage.setItem('searchEngine', searchEngine);
  }, [searchHistory, searchEngine]);

  const handleSearch = (event) => {
    event.preventDefault();
    const searchValue = searchQuery.trim();
    if (searchValue) {
      const updatedHistory = [...searchHistory, searchValue];
      setSearchHistory(updatedHistory);
      setSearchQuery('');
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
          placeholder="Search..."
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
        <button type="submit" className="search-button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
      <div className="search-history">
        <button onClick={handleHistoryToggle}>
          {historyExpanded ? 'Hide' : 'Show'} History
        </button>
        {historyExpanded && (
          <ul>
            {searchHistory.map((historyItem, index) => (
              <li key={index} onClick={() => handleHistoryClick(historyItem)}>
                {historyItem}
              </li>
            ))}
            <li onClick={handleHistoryClear}>Clear History</li>
          </ul>
        )}
      </div>
      <div className="search-engine-switcher">
        <label>
          Search Engine:
          <select value={searchEngine} onChange={handleSearchEngineChange}>
            <option value="google">Google</option>
            <option value="bing">Bing</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default SearchBar;