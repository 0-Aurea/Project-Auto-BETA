import React, { useState, useEffect } from 'react';
import './TabBar.css';

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

  const handleNewTab = () => {
    const newTab = {
      id: Date.now(),
      title: 'New Tab',
      icon: '',
      url: '',
      aboutBlank: true,
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab);
  };

  const handleTabClose = (tab) => {
    const updatedTabs = tabs.filter((t) => t.id !== tab.id);
    setTabs(updatedTabs);
    if (tab.id === activeTab?.id) {
      setActiveTab(updatedTabs.length > 0 ? updatedTabs[0] : null);
    }
  };

  const handleTabUpdate = (tab, updates) => {
    const updatedTabs = tabs.map((t) => (t.id === tab.id ? { ...t, ...updates } : t));
    setTabs(updatedTabs);
  };

  const handleDragStart = (tab) => {
    setIsDragging(true);
    window.dispatchEvent(new CustomEvent('dragstart', { detail: tab }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const draggedTabId = event.dataTransfer.getData('tabId');
    const draggedTab = tabs.find((t) => t.id === parseInt(draggedTabId));
    if (draggedTab) {
      const tabId = event.target.dataset.tabId;
      const tab = tabs.find((t) => t.id === parseInt(tabId));
      if (tab) {
        const index = tabs.indexOf(tab);
        const draggedIndex = tabs.indexOf(draggedTab);
        const updatedTabs = [...tabs];
        updatedTabs.splice(index, 0, updatedTabs.splice(draggedIndex, 1)[0]);
        setTabs(updatedTabs);
      }
    }
  };

  const handleContextMenu = (event, tab) => {
    event.preventDefault();
    const menu = document.getElementById('context-menu');
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    menu.dataset.tabId = tab.id;
    menu.classList.add('show');
  };

  const handleContextMenuClose = () => {
    const menu = document.getElementById('context-menu');
    menu.classList.remove('show');
  };

  const handleAboutBlankCloaking = (tab) => {
    handleTabUpdate(tab, { aboutBlank: !tab.aboutBlank });
  };

  const handleCustomTabTitle = (tab, title) => {
    handleTabUpdate(tab, { title });
  };

  const handleCustomTabIcon = (tab, icon) => {
    handleTabUpdate(tab, { icon });
  };

  return (
    <div
      className="tab-bar"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${activeTab?.id === tab.id ? 'active' : ''}`}
          data-tab-id={tab.id}
          draggable
          onDragStart={() => handleDragStart(tab)}
          onDragEnd={handleDragEnd}
          onClick={() => handleTabClick(tab)}
          onContextMenu={(event) => handleContextMenu(event, tab)}
        >
          <span className="tab-title">{tab.title}</span>
          <button className="tab-close" onClick={() => handleTabClose(tab)}>
            ×
          </button>
        </div>
      ))}
      <button className="new-tab" onClick={handleNewTab}>
        +
      </button>
      <div
        id="context-menu"
        className="context-menu"
        onClick={handleContextMenuClose}
      >
        <ul>
          <li onClick={() => handleAboutBlankCloaking(activeTab)}>Toggle About:blank Cloaking</li>
          <li>
            <input
              type="text"
              value={tabTitle}
              onChange={(event) => setTabTitle(event.target.value)}
              placeholder="Custom Tab Title"
            />
            <button onClick={() => handleCustomTabTitle(activeTab, tabTitle)}>Apply</button>
          </li>
          <li>
            <input
              type="text"
              value={tabIcon}
              onChange={(event) => setTabIcon(event.target.value)}
              placeholder="Custom Tab Icon"
            />
            <button onClick={() => handleCustomTabIcon(activeTab, tabIcon)}>Apply</button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TabBar;