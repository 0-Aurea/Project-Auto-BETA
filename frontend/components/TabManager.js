import React, { useState, useEffect } from 'react';
import './TabManager.css';
import TabBar from './TabBar';

const TabManager = () => {
  const [tabs, setTabs] = useState(() => {
    const storedTabs = localStorage.getItem('tabs');
    return storedTabs ? JSON.parse(storedTabs) : [];
  });
  const [activeTab, setActiveTab] = useState(null);
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');
  const [newTabUrl, setNewTabUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    localStorage.setItem('tabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const addTab = (url, title, icon) => {
    const newTab = {
      id: Date.now(),
      url,
      title,
      icon,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
  };

  const removeTab = (id) => {
    const updatedTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(updatedTabs);
    if (activeTab === id) {
      setActiveTab(updatedTabs.length > 0 ? updatedTabs[0].id : null);
    }
  };

  const updateTab = (id, url, title, icon) => {
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === id) {
        return { ...tab, url, title, icon };
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  const handleDragStart = (event, tab) => {
    event.dataTransfer.setData('tab', JSON.stringify(tab));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    const tab = JSON.parse(event.dataTransfer.getData('tab'));
    const updatedTabs = [...tabs];
    updatedTabs.splice(index, 0, updatedTabs.splice(tabs.indexOf(tab), 1)[0]);
    setTabs(updatedTabs);
  };

  const handleNewTab = () => {
    addTab(newTabUrl, 'New Tab', '');
    setNewTabUrl('');
  };

  return (
    <div className="tab-manager">
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        removeTab={removeTab}
        updateTab={updateTab}
        handleDragStart={handleDragStart}
        handleDragEnd={handleDragEnd}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
      />
      <div className="new-tab-container">
        <input
          type="url"
          value={newTabUrl}
          onChange={(event) => setNewTabUrl(event.target.value)}
          placeholder="Enter URL for new tab"
        />
        <button onClick={handleNewTab}>New Tab</button>
      </div>
    </div>
  );
};

export default TabManager;