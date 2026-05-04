import React, { useState, useEffect } from 'react';

const ProxySettings = () => {
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
    const storedSettings = localStorage.getItem('proxySettings');
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      setEncodingMode(settings.encodingMode);
      setCacheEnabled(settings.cacheEnabled);
      setCacheTTL(settings.cacheTTL);
      setPrefetchEnabled(settings.prefetchEnabled);
      setAdBlockEnabled(settings.adBlockEnabled);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('proxySettings', JSON.stringify({
      encodingMode,
      cacheEnabled,
      cacheTTL,
      prefetchEnabled,
      adBlockEnabled,
    }));
  }, [encodingMode, cacheEnabled, cacheTTL, prefetchEnabled, adBlockEnabled]);

  useEffect(() => {
    localStorage.setItem('adBlockList', JSON.stringify(adBlockList));
  }, [adBlockList]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

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

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
      <button className="settings-toggle" onClick={handleToggle}>
        {isOpen ? 'Close' : 'Settings'}
      </button>
      {isOpen && (
        <div className="settings-content">
          <h2>Proxy Settings</h2>
          <form>
            <label>
              Encoding Mode:
              <select value={encodingMode} onChange={handleEncodingModeChange}>
                <option value="xor-base64">XOR + Base64</option>
                <option value="base64">Base64</option>
              </select>
            </label>
            <label>
              Cache Enabled:
              <input type="checkbox" checked={cacheEnabled} onChange={handleCacheEnabledChange} />
            </label>
            <label>
              Cache TTL (seconds):
              <input type="number" value={cacheTTL} onChange={handleCacheTTLChange} />
            </label>
            <label>
              Prefetch Enabled:
              <input type="checkbox" checked={prefetchEnabled} onChange={handlePrefetchEnabledChange} />
            </label>
            <label>
              Ad Block Enabled:
              <input type="checkbox" checked={adBlockEnabled} onChange={handleAdBlockEnabledChange} />
            </label>
            <label>
              Ad Block List (comma-separated):
              <input type="text" value={adBlockList.join(',')} onChange={handleAdBlockListChange} />
            </label>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProxySettings;