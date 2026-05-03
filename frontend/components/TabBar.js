import React, { useState, useEffect } from 'react';

const TabBar = () => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [tabTitle, setTabTitle] = useState('');
  const [tabIcon, setTabIcon] = useState('');

  useEffect(() => {
    const storedTabs = localStorage.getItem('tabs');
    if (storedTabs) {
      const tabsArray = JSON.parse(storedTabs);
      setTabs(tabsArray);
      if (tabsArray.length > 0) {
        setActiveTab(tabsArray[0]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tabs', JSON.stringify(tabs));
  }, [tabs]);

  const addTab = (title, icon, url) => {
    const newTab = { title, icon, url };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab);
    setTabTitle('');
    setTabIcon('');
  };

  const removeTab = (tab) => {
    const updatedTabs = tabs.filter((t) => t !== tab);
    setTabs(updatedTabs);
    if (tab === activeTab && updatedTabs.length > 0) {
      setActiveTab(updatedTabs[0]);
    } else if (updatedTabs.length === 0) {
      setActiveTab(null);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleTitleChange = (event) => {
    setTabTitle(event.target.value);
  };

  const handleIconChange = (event) => {
    setTabIcon(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (tabTitle && tabIcon) {
      addTab(tabTitle, tabIcon, 'about:blank');
    }
  };

  return (
    <div className="tab-bar">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={tabTitle}
          onChange={handleTitleChange}
          placeholder="Tab title"
        />
        <input
          type="text"
          value={tabIcon}
          onChange={handleIconChange}
          placeholder="Tab icon"
        />
        <button type="submit">New Tab</button>
      </form>
      <ul>
        {tabs.map((tab, index) => (
          <li key={index}>
            <a
              href="#"
              className={activeTab === tab ? 'active' : ''}
              onClick={() => handleTabClick(tab)}
            >
              <img src={tab.icon} alt={tab.title} />
              {tab.title}
            </a>
            <button onClick={() => removeTab(tab)}>Close</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabBar;