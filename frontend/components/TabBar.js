import React, { useState, useEffect } from 'react';

const TabBar = () => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');
  const [tabContent, setTabContent] = useState({});

  useEffect(() => {
    const storedTabs = localStorage.getItem('tabs');
    if (storedTabs) {
      const tabsArray = JSON.parse(storedTabs);
      setTabs(tabsArray);
      if (tabsArray.length > 0) {
        setActiveTab(tabsArray[0].id);
        tabsArray.forEach((tab) => {
          setTabContent((prevContent) => ({
            ...prevContent,
            [tab.id]: tab.content,
          }));
        });
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tabs', JSON.stringify(tabs));
  }, [tabs]);

  const addTab = (url, title, icon, content) => {
    const newTab = {
      id: Date.now(),
      url,
      title,
      icon,
      content,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
    setTabContent((prevContent) => ({
      ...prevContent,
      [newTab.id]: content,
    }));
  };

  const removeTab = (id) => {
    const updatedTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(updatedTabs);
    setTabContent((prevContent) => {
      const newContent = { ...prevContent };
      delete newContent[id];
      return newContent;
    });
    if (activeTab === id && updatedTabs.length > 0) {
      setActiveTab(updatedTabs[0].id);
    } else if (updatedTabs.length === 0) {
      setActiveTab(null);
    }
  };

  const updateTabTitle = (id, title) => {
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === id) {
        return { ...tab, title };
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  const updateTabIcon = (id, icon) => {
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === id) {
        return { ...tab, icon };
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  const updateTabContent = (id, content) => {
    setTabContent((prevContent) => ({
      ...prevContent,
      [id]: content,
    }));
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === id) {
        return { ...tab, content };
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
  };

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab.id)}
        >
          <img src={tab.icon} alt={tab.title} />
          <span>{tab.title}</span>
          <button className="close-tab" onClick={() => removeTab(tab.id)}>
            ×
          </button>
        </div>
      ))}
      <button className="new-tab" onClick={() => addTab('', '', '', '')}>
        +
      </button>
      {activeTab && (
        <div className="tab-content">
          <input
            type="text"
            value={tabTitle}
            onChange={(e) => setTabTitle(e.target.value)}
            placeholder="Tab title"
          />
          <input
            type="text"
            value={tabIcon}
            onChange={(e) => setTabIcon(e.target.value)}
            placeholder="Tab icon"
          />
          <button
            onClick={() =>
              updateTabTitle(activeTab, tabTitle) &&
              updateTabIcon(activeTab, tabIcon)
            }
          >
            Update Tab
          </button>
        </div>
      )}
    </div>
  );
};

export default TabBar;