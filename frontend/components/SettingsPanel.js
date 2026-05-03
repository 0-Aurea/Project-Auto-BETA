import React, { useState, useEffect } from 'react';

const SettingsPanel = () => {
  const [encodingMode, setEncodingMode] = useState('base64');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [adBlockEnabled, setAdBlockEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem('settings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setEncodingMode(settings.encodingMode);
      setCacheEnabled(settings.cacheEnabled);
      setAdBlockEnabled(settings.adBlockEnabled);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify({
      encodingMode,
      cacheEnabled,
      adBlockEnabled,
    }));
  }, [encodingMode, cacheEnabled, adBlockEnabled]);

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

  const handleCacheToggle = () => {
    setCacheEnabled(!cacheEnabled);
  };

  const handleAdBlockToggle = () => {
    setAdBlockEnabled(!adBlockEnabled);
  };

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
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
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;