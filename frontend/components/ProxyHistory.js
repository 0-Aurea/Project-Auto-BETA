import React, { useState, useEffect } from 'react';
import './ProxyHistory.css';

const ProxyHistory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    const storedHistory = localStorage.getItem('proxyHistory');
    return storedHistory ? JSON.parse(storedHistory) : [];
  });

  useEffect(() => {
    localStorage.setItem('proxyHistory', JSON.stringify(history));
  }, [history]);

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleRemoveEntry = (index) => {
    const newHistory = [...history];
    newHistory.splice(index, 1);
    setHistory(newHistory);
  };

  return (
    <div className={`proxy-history ${isOpen ? 'open' : ''}`}>
      <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        Proxy History
      </button>
      {isOpen && (
        <div className="history-container">
          <ul>
            {history.map((entry, index) => (
              <li key={index}>
                <span>{entry.title}</span>
                <span>{entry.url}</span>
                <button onClick={() => handleRemoveEntry(index)}>Remove</button>
              </li>
            ))}
          </ul>
          <button onClick={handleClearHistory}>Clear History</button>
        </div>
      )}
    </div>
  );
};

export default ProxyHistory;