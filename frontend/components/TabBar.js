import React, { useState, useEffect } from 'react';

const TabBar = () => {
  const [tabs, setTabs] = useState([]);
  const [currentTab, setCurrentTab] = useState(null);
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');
  const [tabUrl, setTabUrl] = useState('');

  useEffect(() => {
    const storedTabs = localStorage.getItem('tabs');
    if (storedTabs) {
      setTabs(JSON.parse(storedTabs));
    } else {
      const newTab = {
        id: Date.now(),
        title: 'New Tab',
        icon: '',
        url: '',
        isActive: true,
      };
      setTabs([newTab]);
      setCurrentTab(newTab);
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
      url: tabUrl,
      isActive: true,
    };
    setTabs([...tabs, newTab]);
    setCurrentTab(newTab);
    setTabTitle('');
    setTabIcon('');
    setTabUrl('');
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    tab.isActive = true;
    setTabs(tabs.map((t) => (t.id === tab.id ? tab : { ...t, isActive: false })));
    const tabContent = document.getElementById('tab-content');
    if (tabContent) {
      tabContent.innerHTML = '';
      const iframe = document.createElement('iframe');
      iframe.src = tab.url;
      iframe.frameBorder = '0';
      iframe.width = '100%';
      iframe.height = '100%';
      tabContent.appendChild(iframe);
    }
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

  const handleUrlChange = (event) => {
    setTabUrl(event.target.value);
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
            {tab.icon && (
              <img
                src={tab.icon}
                alt="Tab icon"
                className="tab-icon"
              />
            )}
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
        <input
          type="text"
          placeholder="Tab URL"
          value={tabUrl}
          onChange={handleUrlChange}
        />
        <button onClick={handleNewTab}>New Tab</button>
      </div>
    </div>
  );
};

export default TabBar;