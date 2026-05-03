import React, { useState, useEffect } from 'react';

const TabBar = () => {
  const [tabs, setTabs] = useState([]);
  const [currentTab, setCurrentTab] = useState(null);
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');

  useEffect(() => {
    const storedTabs = localStorage.getItem('tabs');
    if (storedTabs) {
      setTabs(JSON.parse(storedTabs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tabs', JSON.stringify(tabs));
  }, [tabs]);

  const handleNewTab = () => {
    const newTab = {
      id: Date.now(),
      title: tabTitle || 'New Tab',
      icon: tabIcon,
      url: '',
      isActive: true,
    };
    setTabs([...tabs, newTab]);
    setCurrentTab(newTab);
    setTabTitle('');
    setTabIcon('');
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    tab.isActive = true;
    setTabs(tabs.map((t) => (t.id === tab.id ? tab : { ...t, isActive: false })));
  };

  const handleTabClose = (tab) => {
    if (tab.isActive && tabs.length > 1) {
      const newCurrentTab = tabs.find((t) => t.id !== tab.id);
      setCurrentTab(newCurrentTab);
      tab.isActive = false;
    }
    setTabs(tabs.filter((t) => t.id !== tab.id));
  };

  const handleTabUpdate = (tab, updates) => {
    setTabs(
      tabs.map((t) => (t.id === tab.id ? { ...t, ...updates } : t))
    );
  };

  return (
    <div className="tab-bar">
      <div className="tab-bar-left">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.isActive ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            <span className="tab-title">{tab.title}</span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                handleTabClose(tab);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="tab-bar-right">
        <input
          type="text"
          placeholder="Tab title"
          value={tabTitle}
          onChange={(e) => setTabTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Tab icon"
          value={tabIcon}
          onChange={(e) => setTabIcon(e.target.value)}
        />
        <button onClick={handleNewTab}>New Tab</button>
      </div>
    </div>
  );
};

export default TabBar;