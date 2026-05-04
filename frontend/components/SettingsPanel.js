import React, { useState, useEffect } from 'react';

const SettingsPanel = () => {
  const [encodingMode, setEncodingMode] = useState('base64');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [prefetchEnabled, setPrefetchEnabled] = useState(true);
  const [cacheTTL, setCacheTTL] = useState(3600); // 1 hour default
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setEncodingMode(settings.encodingMode);
      setCacheEnabled(settings.cacheEnabled);
      setAdBlockEnabled(settings.adBlockEnabled);
      setPrefetchEnabled(settings.prefetchEnabled);
      setCacheTTL(settings.cacheTTL);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify({
      encodingMode,
      cacheEnabled,
      adBlockEnabled,
      prefetchEnabled,
      cacheTTL,
    }));
  }, [encodingMode, cacheEnabled, adBlockEnabled, prefetchEnabled, cacheTTL]);

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

  const handleCacheToggle = () => {
    setCacheEnabled(!cacheEnabled);
  };

  const handleAdBlockToggle = () => {
    setAdBlockEnabled(!adBlockEnabled);
  };

  const handlePrefetchToggle = () => {
    setPrefetchEnabled(!prefetchEnabled);
  };

  const handleCacheTTLChange = (event) => {
    setCacheTTL(event.target.value);
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleResetSettings = () => {
    setEncodingMode('base64');
    setCacheEnabled(true);
    setAdBlockEnabled(true);
    setPrefetchEnabled(true);
    setCacheTTL(3600);
  };

  return (
    <div className="settings-panel" id="settings-panel">
      <button className="settings-toggle" id="settings-toggle" onClick={handleSettingsToggle}>
        {settingsOpen ? 'Close Settings' : 'Open Settings'}
      </button>
      {settingsOpen && (
        <div className="settings-content">
          <h2>Settings</h2>
          <div className="settings-group">
            <label>Encoding Mode:</label>
            <select value={encodingMode} onChange={handleEncodingModeChange}>
              <option value="base64">Base64</option>
              <option value="xor">XOR</option>
            </select>
          </div>
          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={cacheEnabled}
                onChange={handleCacheToggle}
              />
              Enable Cache
            </label>
            <small>Cache helps improve performance by storing frequently accessed resources locally.</small>
          </div>
          {cacheEnabled && (
            <div className="settings-group">
              <label>Cache TTL (seconds):</label>
              <input
                type="number"
                value={cacheTTL}
                onChange={handleCacheTTLChange}
              />
              <small>Sets the time to live for cached resources.</small>
            </div>
          )}
          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={prefetchEnabled}
                onChange={handlePrefetchToggle}
              />
              Enable Prefetch Hints
            </label>
            <small>Prefetch hints help improve performance by caching resources before they are requested.</small>
          </div>
          <div className="settings-group">
            <label>
              <input
                type="checkbox"
                checked={adBlockEnabled}
                onChange={handleAdBlockToggle}
              />
              Enable Ad Block
            </label>
            <small>Ad block helps prevent ads from being displayed on proxied websites.</small>
          </div>
          <div className="settings-group">
            <button
              className="reset-settings"
              onClick={handleResetSettings}
            >
              Reset Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;