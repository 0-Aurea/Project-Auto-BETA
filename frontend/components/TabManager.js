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

    this.renderNewTabButton = this.renderNewTabButton.bind(this);
    this.renderNewTabButton();
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

    tabElement.style.transition = 'transform 0.2s ease-in-out';
    tabElement.style.transform = 'scale(1)';
    tabElement.addEventListener('mouseover', () => {
      tabElement.style.transform = 'scale(1.02)';
    });
    tabElement.addEventListener('mouseout', () => {
      tabElement.style.transform = 'scale(1)';
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
    tabElement.style.transition = 'transform 0.2s ease-in-out';
    tabElement.style.transform = 'scale(0.5)';
    tabElement.addEventListener('transitionend', () => {
      this.tabBarElement.removeChild(tabElement);
    });

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
    this.renderNewTabButton();
  }

  switchTab(tabId) {
    if (this.activeTabId === tabId) return;

    const oldTab = this.tabs.find((tab) => tab.id === this.activeTabId);
    if (oldTab) {
      oldTab.iframeEl.style.display = 'none';
      oldTab.iframeEl.style.opacity = 0;
      oldTab.iframeEl.style.zIndex = -1;
      const oldTabElement = this.tabBarElement.children[this.tabs.findIndex((tab) => tab.id === this.activeTabId)];
      oldTabElement.classList.remove('active');
      oldTabElement.style.borderBottom = 'none';
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

    const newTabElement = this.tabBarElement.children[this.tabs.findIndex((tab) => tab.id === tabId)];
    newTabElement.classList.add('active');
    newTabElement.style.borderBottom = '2px solid var(--accent)';
    newTabElement.style.transition = 'border-bottom 0.2s ease-in-out';

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
    this.addTab({ url: '', title: '', favicon: '' });
  }

  renderNewTabButton() {
    const newTabButton = document.createElement('button');
    newTabButton.classList.add('new-tab-button');
    newTabButton.textContent = '+';
    newTabButton.style.transition = 'transform 0.2s ease-in-out';
    newTabButton.addEventListener('mouseover', () => {
      newTabButton.style.transform = 'scale(1.02)';
    });
    newTabButton.addEventListener('mouseout', () => {
      newTabButton.style.transform = 'scale(1)';
    });
    this.tabBarElement.appendChild(newTabButton);
  }

  renderTabBar() {
    const tabElements = this.tabBarElement.children;
    Array.from(tabElements).forEach((tabElement, index) => {
      if (index < this.tabs.length) {
        const tab = this.tabs[index];
        tabElement.querySelector('.tab-favicon').src = tab.favicon || 'https://example.com/globe-emoji.png';
        tabElement.querySelector('.tab-title').textContent = tab.title || 'Untitled';
      } else if (tabElement.classList.contains('new-tab-button')) {
        // do nothing
      } else {
        tabElement.remove();
      }
    });
  }
}