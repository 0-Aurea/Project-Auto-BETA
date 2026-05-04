import React, { useState, useEffect } from 'react';
import './TabBar.css';

const TabBar = () => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');
  const [tabContent, setTabContent] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragoverIndex, setDragoverIndex] = useState(null);

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

  const handleDragStart = (event, index) => {
    setDragging(index);
  };

  const handleDragOver = (event, index) => {
    event.preventDefault();
    setDragoverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragging !== null && dragoverIndex !== null) {
      const tabsArray = [...tabs];
      const draggedTab = tabsArray[dragging];
      tabsArray.splice(dragging, 1);
      tabsArray.splice(dragoverIndex, 0, draggedTab);
      setTabs(tabsArray);
      setDragging(null);
      setDragoverIndex(null);
    }
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    handleDragEnd();
  };

  return (
    <div className="tab-bar">
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          draggable
          onDragStart={(event) => handleDragStart(event, index)}
          onDragOver={(event) => handleDragOver(event, index)}
          onDrop={(event) => handleDrop(event, index)}
        >
          <img src={tab.icon} alt={tab.title} />
          <span>{tab.title}</span>
          <button onClick={() => removeTab(tab.id)}>X</button>
          <div
            className="tab-content"
            onClick={() => handleTabClick(tab.id)}
          >
            {tabContent[tab.id]}
          </div>
        </div>
      ))}
      <button className="add-tab" onClick={() => addTab('', '', '', '')}>
        +
      </button>
    </div>
  );
};

export default TabBar;