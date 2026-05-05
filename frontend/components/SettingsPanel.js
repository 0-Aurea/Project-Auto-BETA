import React, { useState, useEffect } from 'react';
import './SettingsPanel.css';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [encodingMode, setEncodingMode] = useState(() => {
    const storedMode = localStorage.getItem('encodingMode');
    return storedMode ? storedMode : 'xor-base64';
  });
  const [cacheEnabled, setCacheEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('cacheEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
  });
  const [cacheTTL, setCacheTTL] = useState(() => {
    const storedTTL = localStorage.getItem('cacheTTL');
    return storedTTL ? parseInt(storedTTL) : 3600; // 1 hour default
  });
  const [adBlockEnabled, setAdBlockEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('adBlockEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
  });
  const [adBlockList, setAdBlockList] = useState(() => {
    const storedAdBlockList = localStorage.getItem('adBlockList');
    return storedAdBlockList ? JSON.parse(storedAdBlockList) : [];
  });
  const [prefetchEnabled, setPrefetchEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('prefetchEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('encodingMode', encodingMode);
  }, [encodingMode]);

  useEffect(() => {
    localStorage.setItem('cacheEnabled', cacheEnabled.toString());
  }, [cacheEnabled]);

  useEffect(() => {
    localStorage.setItem('cacheTTL', cacheTTL.toString());
  }, [cacheTTL]);

  useEffect(() => {
    localStorage.setItem('adBlockEnabled', adBlockEnabled.toString());
  }, [adBlockEnabled]);

  useEffect(() => {
    localStorage.setItem('adBlockList', JSON.stringify(adBlockList));
  }, [adBlockList]);

  useEffect(() => {
    localStorage.setItem('prefetchEnabled', prefetchEnabled.toString());
  }, [prefetchEnabled]);

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

  const handleCacheToggle = () => {
    setCacheEnabled(!cacheEnabled);
  };

  const handleCacheTTLChange = (event) => {
    setCacheTTL(parseInt(event.target.value));
  };

  const handleAdBlockToggle = () => {
    setAdBlockEnabled(!adBlockEnabled);
  };

  const handlePrefetchToggle = () => {
    setPrefetchEnabled(!prefetchEnabled);
  };

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <h2>Settings</h2>
      <div className="settings-group">
        <label>Encoding Mode:</label>
        <select value={encodingMode} onChange={handleEncodingModeChange}>
          <option value="xor-base64">XOR + Base64</option>
          <option value="base64">Base64</option>
          <option value="xor">XOR</option>
        </select>
      </div>
      <div className="settings-group">
        <label>
          <input type="checkbox" checked={cacheEnabled} onChange={handleCacheToggle} />
          Enable Cache
        </label>
        <input type="number" value={cacheTTL} onChange={handleCacheTTLChange} />
        <span>Cache TTL (seconds)</span>
      </div>
      <div className="settings-group">
        <label>
          <input type="checkbox" checked={adBlockEnabled} onChange={handleAdBlockToggle} />
          Enable Ad Block
        </label>
      </div>
      <div className="settings-group">
        <label>
          <input type="checkbox" checked={prefetchEnabled} onChange={handlePrefetchToggle} />
          Enable Prefetch
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;