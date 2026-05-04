import React, { useState, useEffect } from 'react';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [encodingMode, setEncodingMode] = useState('xor-base64');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [cacheTTL, setCacheTTL] = useState(3600); // 1 hour default
  const [prefetchEnabled, setPrefetchEnabled] = useState(true);
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [adBlockList, setAdBlockList] = useState(() => {
    const storedAdBlockList = localStorage.getItem('adBlockList');
    return storedAdBlockList ? JSON.parse(storedAdBlockList) : [];
  });

  useEffect(() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setEncodingMode(settings.encodingMode || 'xor-base64');
      setCacheEnabled(settings.cacheEnabled !== false);
      setCacheTTL(settings.cacheTTL || 3600);
      setPrefetchEnabled(settings.prefetchEnabled !== false);
      setAdBlockEnabled(settings.adBlockEnabled !== false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify({
      encodingMode,
      cacheEnabled,
      cacheTTL,
      prefetchEnabled,
      adBlockEnabled,
    }));
  }, [encodingMode, cacheEnabled, cacheTTL, prefetchEnabled, adBlockEnabled]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

  const handleCacheToggle = () => {
    setCacheEnabled(!cacheEnabled);
  };

  const handleCacheTTLChange = (event) => {
    setCacheTTL(parseInt(event.target.value, 10));
  };

  const handlePrefetchToggle = () => {
    setPrefetchEnabled(!prefetchEnabled);
  };

  const handleAdBlockToggle = () => {
    setAdBlockEnabled(!adBlockEnabled);
  };

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <button className="settings-toggle" onClick={handleToggle}>
        Settings
      </button>
      <div className="settings-content">
        <h2>Settings</h2>
        <section>
          <h3>Encoding Mode</h3>
          <select value={encodingMode} onChange={handleEncodingModeChange}>
            <option value="xor-base64">XOR + Base64</option>
            <option value="base64">Base64</option>
          </select>
        </section>
        <section>
          <h3>Cache</h3>
          <label>
            <input
              type="checkbox"
              checked={cacheEnabled}
              onChange={handleCacheToggle}
            />
            Enable Cache
          </label>
          <input
            type="number"
            value={cacheTTL}
            onChange={handleCacheTTLChange}
            disabled={!cacheEnabled}
          />
        </section>
        <section>
          <h3>Prefetch</h3>
          <label>
            <input
              type="checkbox"
              checked={prefetchEnabled}
              onChange={handlePrefetchToggle}
            />
            Enable Prefetch
          </label>
        </section>
        <section>
          <h3>Ad Block</h3>
          <label>
            <input
              type="checkbox"
              checked={adBlockEnabled}
              onChange={handleAdBlockToggle}
            />
            Enable Ad Block
          </label>
        </section>
      </div>
    </div>
  );
};

export default SettingsPanel;