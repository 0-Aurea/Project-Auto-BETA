import React, { useState, useEffect } from 'react';

const ProxyHistory = () => {
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedHistory = localStorage.getItem('proxyHistory');
    if (storedHistory) {
      const historyArray = JSON.parse(storedHistory);
      setHistory(historyArray);
      setFilteredHistory(historyArray);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('proxyHistory', JSON.stringify(history));
  }, [history]);

  const handleSearch = (event) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchTerm(searchTerm);
    const filteredHistory = history.filter((item) => {
      return item.url.toLowerCase().includes(searchTerm) || item.title.toLowerCase().includes(searchTerm);
    });
    setFilteredHistory(filteredHistory);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setFilteredHistory([]);
    localStorage.removeItem('proxyHistory');
  };

  const handleRemoveFromHistory = (url) => {
    const updatedHistory = history.filter((item) => item.url !== url);
    setHistory(updatedHistory);
    setFilteredHistory(updatedHistory.filter((item) => {
      return item.url.toLowerCase().includes(searchTerm) || item.title.toLowerCase().includes(searchTerm);
    }));
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