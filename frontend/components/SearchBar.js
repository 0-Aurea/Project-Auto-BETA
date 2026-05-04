import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  const handleSearch = (event) => {
    event.preventDefault();
    const searchValue = searchQuery.trim();
    if (searchValue) {
      const updatedHistory = [...searchHistory, searchValue];
      setSearchHistory(updatedHistory);
      setSearchQuery('');
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

  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem);
  };

  const handleHistoryClear = () => {
    setSearchHistory([]);
  };

  const handleHistoryToggle = () => {
    setHistoryExpanded(!historyExpanded);
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
        {searchHistory.length > 0 && (
          <div className="search-history-container">
            <button className="history-toggle" onClick={handleHistoryToggle}>
              {historyExpanded ? 'Hide' : 'Show'} History
            </button>
            {historyExpanded && (
              <ul className="search-history">
                {searchHistory.map((historyItem, index) => (
                  <li key={index}>
                    <button onClick={() => handleHistoryClick(historyItem)}>
                      {historyItem}
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={handleHistoryClear}>Clear History</button>
                </li>
              </ul>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;