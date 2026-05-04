import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [encodingMode, setEncodingMode] = useState(() => {
    const storedMode = localStorage.getItem('encodingMode');
    return storedMode ? storedMode : 'xor';
  });
  const [cacheEnabled, setCacheEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('cacheEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
  });
  const [adBlockEnabled, setAdBlockEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('adBlockEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
  });
  const [searchEngine, setSearchEngine] = useState(() => {
    const storedEngine = localStorage.getItem('searchEngine');
    return storedEngine ? storedEngine : 'google';
  });
  const [adBlockFilterList, setAdBlockFilterList] = useState(() => {
    const storedFilterList = localStorage.getItem('adBlockFilterList');
    return storedFilterList ? JSON.parse(storedFilterList) : [];
  });

  useEffect(() => {
    localStorage.setItem('encodingMode', encodingMode);
  }, [encodingMode]);

  useEffect(() => {
    localStorage.setItem('cacheEnabled', cacheEnabled.toString());
  }, [cacheEnabled]);

  useEffect(() => {
    localStorage.setItem('adBlockEnabled', adBlockEnabled.toString());
  }, [adBlockEnabled]);

  useEffect(() => {
    localStorage.setItem('searchEngine', searchEngine);
  }, [searchEngine]);

  useEffect(() => {
    localStorage.setItem('adBlockFilterList', JSON.stringify(adBlockFilterList));
  }, [adBlockFilterList]);

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

  const handleCacheToggle = () => {
    setCacheEnabled(!cacheEnabled);
  };

  const handleAdBlockToggle = () => {
    setAdBlockEnabled(!adBlockEnabled);
  };

  const handleSearchEngineChange = (event) => {
    setSearchEngine(event.target.value);
  };

  const handleAdBlockFilterListChange = (event) => {
    const filterList = event.target.value.split(',');
    setAdBlockFilterList(filterList.map((filter) => filter.trim()));
  };

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <button className="settings-toggle" onClick={() => setIsOpen(!isOpen)}>
        Settings
      </button>
      <div className="settings-content">
        <h2>Settings</h2>
        <div className="settings-group">
          <label>Encoding Mode:</label>
          <select value={encodingMode} onChange={handleEncodingModeChange}>
            <option value="xor">XOR</option>
            <option value="base64">Base64</option>
          </select>
        </div>
        <div className="settings-group">
          <label>Cache:</label>
          <button onClick={handleCacheToggle}>
            {cacheEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
        <div className="settings-group">
          <label>Ad Block:</label>
          <button onClick={handleAdBlockToggle}>
            {adBlockEnabled ? 'Enabled' : 'Disabled'}
          </button>
          {adBlockEnabled && (
            <div>
              <label>Filter List:</label>
              <input
                type="text"
                value={adBlockFilterList.join(', ')}
                onChange={handleAdBlockFilterListChange}
                placeholder="Enter filter list (comma-separated)"
              />
            </div>
          )}
        </div>
        <div className="settings-group">
          <label>Search Engine:</label>
          <select value={searchEngine} onChange={handleSearchEngineChange}>
            <option value="google">Google</option>
            <option value="bing">Bing</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;