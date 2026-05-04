import React, { useState, useEffect } from 'react';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [cacheTTL, setCacheTTL] = useState(3600); // 1 hour default
  const [prefetchEnabled, setPrefetchEnabled] = useState(true);
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [adBlockList, setAdBlockList] = useState([]);
  const [encodingMode, setEncodingMode] = useState('xor-base64');

  useEffect(() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setCacheEnabled(settings.cacheEnabled);
      setCacheTTL(settings.cacheTTL);
      setPrefetchEnabled(settings.prefetchEnabled);
      setAdBlockEnabled(settings.adBlockEnabled);
      setAdBlockList(settings.adBlockList);
      setEncodingMode(settings.encodingMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify({
      cacheEnabled,
      cacheTTL,
      prefetchEnabled,
      adBlockEnabled,
      adBlockList,
      encodingMode,
    }));
  }, [cacheEnabled, cacheTTL, prefetchEnabled, adBlockEnabled, adBlockList, encodingMode]);

  const handleCacheEnabledChange = (event) => {
    setCacheEnabled(event.target.checked);
  };

  const handleCacheTTLChange = (event) => {
    setCacheTTL(event.target.value);
  };

  const handlePrefetchEnabledChange = (event) => {
    setPrefetchEnabled(event.target.checked);
  };

  const handleAdBlockEnabledChange = (event) => {
    setAdBlockEnabled(event.target.checked);
  };

  const handleAdBlockListChange = (event) => {
    setAdBlockList(event.target.value.split(','));
  };

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <button className="settings-toggle" onClick={() => setIsOpen(!isOpen)}>
        Settings
      </button>
      <div className="settings-content">
        <h2>Cache Settings</h2>
        <label>
          Enable Cache:
          <input type="checkbox" checked={cacheEnabled} onChange={handleCacheEnabledChange} />
        </label>
        <label>
          Cache TTL (seconds):
          <input type="number" value={cacheTTL} onChange={handleCacheTTLChange} />
        </label>
        <h2>Prefetch Settings</h2>
        <label>
          Enable Prefetch:
          <input type="checkbox" checked={prefetchEnabled} onChange={handlePrefetchEnabledChange} />
        </label>
        <h2>Ad Block Settings</h2>
        <label>
          Enable Ad Block:
          <input type="checkbox" checked={adBlockEnabled} onChange={handleAdBlockEnabledChange} />
        </label>
        <label>
          Ad Block List (comma-separated):
          <input type="text" value={adBlockList.join(',')} onChange={handleAdBlockListChange} />
        </label>
        <h2>Encoding Settings</h2>
        <label>
          Encoding Mode:
          <select value={encodingMode} onChange={handleEncodingModeChange}>
            <option value="xor-base64">XOR + Base64</option>
            <option value="base64">Base64</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;