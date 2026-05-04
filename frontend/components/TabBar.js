import React, { useState, useEffect } from 'react';
import './TabBar.css';
import Tab from './Tab';

const TabBar = () => {
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
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleTabClose = (tab) => {
    const updatedTabs = tabs.filter((t) => t.id !== tab.id);
    setTabs(updatedTabs);
    if (tab.id === activeTab.id) {
      setActiveTab(updatedTabs.length > 0 ? updatedTabs[0] : null);
    }
  };

  const handleTabReload = (tab) => {
    // Reload the tab content
    const updatedTabs = tabs.map((t) => {
      if (t.id === tab.id) {
        return { ...t, reload: true };
      }
      return t;
    });
    setTabs(updatedTabs);
  };

  const handleNewTab = () => {
    const newTab = {
      id: Date.now(),
      title: tabTitle,
      icon: tabIcon,
      url: newTabUrl,
      reload: false,
    };
    setTabs([...tabs, newTab]);
    setTabTitle('');
    setTabIcon('');
    setNewTabUrl('');
    setActiveTab(newTab);
  };

  const handleDragStart = (tab) => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e, tab) => {
    e.preventDefault();
  };

  const handleDrop = (e, tab) => {
    e.preventDefault();
    const updatedTabs = tabs.map((t) => {
      if (t.id === tab.id) {
        return { ...t, url: newTabUrl };
      }
      return t;
    });
    setTabs(updatedTabs);
  };

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          tab={tab}
          active={tab.id === activeTab.id}
          onClick={() => handleTabClick(tab)}
          onClose={() => handleTabClose(tab)}
          onReload={() => handleTabReload(tab)}
          onDragStart={() => handleDragStart(tab)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, tab)}
          onDrop={(e) => handleDrop(e, tab)}
        />
      ))}
      <div className="new-tab">
        <input
          type="text"
          placeholder="Enter tab title"
          value={tabTitle}
          onChange={(e) => setTabTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter tab icon"
          value={tabIcon}
          onChange={(e) => setTabIcon(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter new tab URL"
          value={newTabUrl}
          onChange={(e) => setNewTabUrl(e.target.value)}
        />
        <button onClick={handleNewTab}>New Tab</button>
      </div>
    </div>
  );
};

export default TabBar;