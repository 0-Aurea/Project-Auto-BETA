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
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrop = (tab, event) => {
    event.preventDefault();
    const updatedTabs = tabs.map((t) => (t.id === tab.id ? { ...t } : t));
    const draggedTab = tabs.find((t) => t.id === event.dataTransfer.getData('tabId'));
    if (draggedTab) {
      const index = updatedTabs.indexOf(tab);
      const draggedIndex = updatedTabs.indexOf(draggedTab);
      updatedTabs.splice(index, 0, updatedTabs.splice(draggedIndex, 1)[0]);
      setTabs(updatedTabs);
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
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${activeTab?.id === tab.id ? 'active' : ''}`}
          onClick={() => handleTabClick(tab)}
          draggable
          onDragStart={() => handleDragStart(tab)}
          onDragEnd={handleDragEnd}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(tab, event)}
          onContextMenu={(event) => handleContextMenu(event, tab)}
        >
          <span className="tab-title">{tab.title}</span>
          <span className="tab-icon">{tab.icon}</span>
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
          <li onClick={() => handleAboutBlankCloaking(activeTab)}>Toggle about:blank cloaking</li>
          <li>
            <input
              type="text"
              placeholder="Custom tab title"
              onBlur={(event) => handleCustomTabTitle(activeTab, event.target.value)}
            />
          </li>
          <li>
            <input
              type="text"
              placeholder="Custom tab icon"
              onBlur={(event) => handleCustomTabIcon(activeTab, event.target.value)}
            />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TabBar;