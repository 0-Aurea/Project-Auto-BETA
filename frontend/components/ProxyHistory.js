import React, { useState, useEffect } from 'react';
import './ProxyHistory.css';

const ProxyHistory = () => {
  const [history, setHistory] = useState(() => {
    const storedHistory = localStorage.getItem('proxyHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });
  const [filteredHistory, setFilteredHistory] = useState(history);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    localStorage.setItem('proxyHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const filteredHistory = history.filter((item) => {
      return item.url.toLowerCase().includes(searchTerm.toLowerCase()) || item.title.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredHistory(filteredHistory);
  }, [searchTerm, history]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setFilteredHistory([]);
    localStorage.removeItem('proxyHistory');
  };

  const handleRemoveFromHistory = (url) => {
    const updatedHistory = history.filter((item) => item.url !== url);
    setHistory(updatedHistory);
  };

  const handleSort = (sortBy) => {
    setSortBy(sortBy);
    const sortedHistory = [...history].sort((a, b) => {
      if (sortBy === 'title') {
        return sortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else if (sortBy === 'url') {
        return sortOrder === 'asc' ? a.url.localeCompare(b.url) : b.url.localeCompare(a.url);
      } else {
        return 0;
      }
    });
    setHistory(sortedHistory);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="proxy-history">
      <h2>Proxy History</h2>
      <input
        type="search"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search history"
      />
      <div className="history-toolbar">
        <button onClick={() => handleSort('title')}>Sort by Title {sortBy === 'title' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</button>
        <button onClick={() => handleSort('url')}>Sort by URL {sortBy === 'url' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</button>
      </div>
      <ul>
        {filteredHistory.map((item, index) => (
          <li key={index}>
            <a href={item.url}>{item.title}</a>
            <button onClick={() => handleRemoveFromHistory(item.url)}>Remove</button>
          </li>
        ))}
      </ul>
      {history.length > 0 && (
        <button onClick={handleClearHistory}>Clear History</button>
      )}
    </div>
  );
};

export default ProxyHistory;