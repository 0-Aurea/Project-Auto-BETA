import React, { useState, useEffect } from 'react';

const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [encodingMode, setEncodingMode] = useState(() => {
    const storedMode = localStorage.getItem('encodingMode');
    return storedMode ? storedMode : 'base64';
  });
  const [cacheEnabled, setCacheEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('cacheEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
  });
  const [adBlockEnabled, setAdBlockEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('adBlockEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
  });
  const [webrtcProtectionEnabled, setWebrtcProtectionEnabled] = useState(() => {
    const storedEnabled = localStorage.getItem('webrtcProtectionEnabled');
    return storedEnabled ? storedEnabled === 'true' : true;
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
    localStorage.setItem('webrtcProtectionEnabled', webrtcProtectionEnabled.toString());
  }, [webrtcProtectionEnabled]);

  const handleEncodingModeChange = (event) => {
    setEncodingMode(event.target.value);
  };

  const handleCacheToggle = () => {
    setCacheEnabled(!cacheEnabled);
  };

  const handleAdBlockToggle = () => {
    setAdBlockEnabled(!adBlockEnabled);
  };

  const handleWebrtcProtectionToggle = () => {
    setWebrtcProtectionEnabled(!webrtcProtectionEnabled);
  };

  return (
    <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
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
          <input type="checkbox" checked={cacheEnabled} onChange={handleCacheToggle} />
          Enable Cache
        </label>
      </div>
      <div className="settings-group">
        <label>
          <input type="checkbox" checked={adBlockEnabled} onChange={handleAdBlockToggle} />
          Enable Ad Block
        </label>
      </div>
      <div className="settings-group">
        <label>
          <input type="checkbox" checked={webrtcProtectionEnabled} onChange={handleWebrtcProtectionToggle} />
          Enable WebRTC Leak Protection
        </label>
      </div>
    </div>
  );
};

export default SettingsPanel;