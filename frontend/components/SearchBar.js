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
      window.open(`${url}?${params.toString()}`, '_blank');
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
        <div className="search-history">
          {historyExpanded && (
            <ul>
              {searchHistory.map((historyItem, index) => (
                <li key={index} onClick={() => handleHistoryClick(historyItem)}>
                  {historyItem}
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={handleHistoryToggle}>
            {historyExpanded ? 'Hide' : 'Show'} History
          </button>
          <button type="button" onClick={handleHistoryClear}>
            Clear History
          </button>
        </div>
        <select value={searchEngine} onChange={handleSearchEngineChange}>
          <option value="google">Google</option>
          <option value="bing">Bing</option>
        </select>
      </form>
    </div>
  );
};

export default SearchBar;