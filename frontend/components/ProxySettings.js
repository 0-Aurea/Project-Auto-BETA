import React, { useState, useEffect } from 'react';
import './ProxySettings.css';

const ProxySettings = () => {
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
  const [prefetchEnabled, setPrefetchEnabled] = useState(() => {
    const storedPrefetchEnabled = localStorage.getItem('prefetchEnabled');
    return storedPrefetchEnabled ? storedPrefetchEnabled === 'true' : true;
  });
  const [adBlockEnabled, setAdBlockEnabled] = useState(() => {
    const storedAdBlockEnabled = localStorage.getItem('adBlockEnabled');
    return storedAdBlockEnabled ? storedAdBlockEnabled === 'true' : true;
  });
  const [adBlockList, setAdBlockList] = useState(() => {
    const storedAdBlockList = localStorage.getItem('adBlockList');
    return storedAdBlockList ? JSON.parse(storedAdBlockList) : [];
  });

  useEffect(() => {
    localStorage.setItem('encodingMode', encodingMode);
    localStorage.setItem('cacheEnabled', cacheEnabled.toString());
    localStorage.setItem('cacheTTL', cacheTTL.toString());
    localStorage.setItem('prefetchEnabled', prefetchEnabled.toString());
    localStorage.setItem('adBlockEnabled', adBlockEnabled.toString());
    localStorage.setItem('adBlockList', JSON.stringify(adBlockList));
  }, [encodingMode, cacheEnabled, cacheTTL, prefetchEnabled, adBlockEnabled, adBlockList]);

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
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value > 0) {
      setCacheTTL(value);
    }
  };

  const handlePrefetchEnabledChange = (event) => {
    setPrefetchEnabled(event.target.checked);
  };

  const handleAdBlockEnabledChange = (event) => {
    setAdBlockEnabled(event.target.checked);
  };

  const handleAdBlockListChange = (event) => {
    setAdBlockList(event.target.value.split(',').map(item => item.trim()));
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
              <input type="text" value={adBlockList.join(', ')} onChange={handleAdBlockListChange} />
            </label>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProxySettings;