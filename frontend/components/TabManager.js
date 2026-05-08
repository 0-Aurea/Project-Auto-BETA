import { encode } from '../sw-config.js';

export class TabManager {
  constructor({ tabBarElement, viewportElement, onTabChange }) {
    this.tabBarElement = tabBarElement;
    this.viewportElement = viewportElement;
    this.onTabChange = onTabChange;
    this.tabs = [];
    this.activeTabId = null;
    this.tabIdCounter = 0;

    this.handleTabClose = this.handleTabClose.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleNewTab = this.handleNewTab.bind(this);

    this.renderTabBar = this.renderTabBar.bind(this);
    this.addTab = this.addTab.bind(this);
    this.removeTab = this.removeTab.bind(this);
    this.switchTab = this.switchTab.bind(this);

    this.tabBarElement.addEventListener('click', (e) => {
      if (e.target.classList.contains('new-tab-button')) {
        this.handleNewTab();
      }
    });
  }

  addTab({ url = '', title = '', favicon = '' }) {
    const tabId = this.tabIdCounter++;
    const tab = {
      id: tabId,
      url,
      title,
      favicon,
      iframeEl: null,
    };

    this.tabs.push(tab);

    const tabElement = document.createElement('div');
    tabElement.classList.add('tab');
    tabElement.innerHTML = `
      <img class="tab-favicon" src="${favicon || 'https://example.com/globe-emoji.png'}">
      <span class="tab-title">${title || 'Untitled'}</span>
      <button class="tab-close" aria-label="Close tab">×</button>
    `;

    tabElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('tab-close')) {
        this.handleTabClick(tabId);
      }
    });

    tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleTabClose(tabId);
    });

    this.tabBarElement.appendChild(tabElement);

    tab.iframeEl = document.createElement('iframe');
    tab.iframeEl.src = url;
    tab.iframeEl.style.display = 'none';
    tab.iframeEl.style.zIndex = -1;
    tab.iframeEl.style.opacity = 0;
    tab.iframeEl.style.transition = 'opacity 0.2s ease-in-out';
    this.viewportElement.appendChild(tab.iframeEl);

    if (this.tabs.length === 1) {
      this.switchTab(tabId);
    }

    this.renderTabBar();
  }

  removeTab(tabId) {
    const tabIndex = this.tabs.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) return;

    const tab = this.tabs.splice(tabIndex, 1)[0];
    tab.iframeEl.remove();
    const tabElement = this.tabBarElement.children[tabIndex];
    this.tabBarElement.removeChild(tabElement);

    if (tabId === this.activeTabId) {
      if (this.tabs.length > 0) {
        this.switchTab(this.tabs[tabIndex < this.tabs.length ? tabIndex : tabIndex - 1].id);
      } else {
        this.activeTabId = null;
        this.viewportElement.innerHTML = `
          <div class="search-hero">
            <form id="search-form">
              <input type="text" id="search-input" placeholder="Search or enter a URL...">
              <button type="submit" id="search-button">Go</button>
            </form>
          </div>
        `;
      }
    }

    this.renderTabBar();
  }

  switchTab(tabId) {
    if (this.activeTabId === tabId) return;

    const oldTab = this.tabs.find((tab) => tab.id === this.activeTabId);
    if (oldTab) {
      oldTab.iframeEl.style.display = 'none';
      oldTab.iframeEl.style.opacity = 0;
      oldTab.iframeEl.style.zIndex = -1;
    }

    const newTab = this.tabs.find((tab) => tab.id === tabId);
    newTab.iframeEl.style.zIndex = 1;
    newTab.iframeEl.style.display = 'block';
    newTab.iframeEl.style.opacity = 0;
    setTimeout(() => {
      newTab.iframeEl.style.opacity = 1;
    }, 50);
    if (!newTab.iframeEl.src || newTab.iframeEl.src === 'about:blank') {
      newTab.iframeEl.src = encode(newTab.url);
    }

    this.activeTabId = tabId;
    this.onTabChange(tabId);

    this.renderTabBar();
  }

  handleTabClose(tabId) {
    this.removeTab(tabId);
  }

  handleTabClick(tabId) {
    this.switchTab(tabId);
  }

  handleNewTab() {
    this.addTab({});
  }

  renderTabBar() {
    Array.from(this.tabBarElement.children).forEach((tabElement) => {
      tabElement.classList.remove('active');
    });

    const activeTabElement = this.tabBarElement.children[this.tabs.findIndex((tab) => tab.id === this.activeTabId)];
    if (activeTabElement) {
      activeTabElement.classList.add('active');
    }

    if (this.tabs.length > 0) {
      this.tabBarElement.querySelector('.new-tab-button').style.display = 'inline-block';
    } else {
      this.tabBarElement.querySelector('.new-tab-button').style.display = 'none';
    }
  }

  updateTabBar() {
    this.tabBarElement.innerHTML = '';

    this.tabs.forEach((tab) => {
      const tabElement = document.createElement('div');
      tabElement.classList.add('tab');
      tabElement.innerHTML = `
        <img class="tab-favicon" src="${tab.favicon || 'https://example.com/globe-emoji.png'}">
        <span class="tab-title">${tab.title || 'Untitled'}</span>
        <button class="tab-close" aria-label="Close tab">×</button>
      `;

      tabElement.addEventListener('click', (e) => {
        if (!e.target.classList.contains('tab-close')) {
          this.handleTabClick(tab.id);
        }
      });

      tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleTabClose(tab.id);
      });

      this.tabBarElement.appendChild(tabElement);
    });

    const newTabButton = document.createElement('button');
    newTabButton.classList.add('new-tab-button');
    newTabButton.textContent = '+';
    newTabButton.addEventListener('click', this.handleNewTab);
    this.tabBarElement.appendChild(newTabButton);

    this.renderTabBar();
  }
}