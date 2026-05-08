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

    this.init();
  }

  init() {
    if (this.viewportElement.children.length > 0) {
      const existingIframe = this.viewportElement.children[0];
      if (existingIframe.tagName === 'IFRAME') {
        const newTab = {
          id: 0,
          url: existingIframe.src,
          title: '',
          favicon: '',
          iframeEl: existingIframe,
        };
        this.tabs.push(newTab);
        this.activeTabId = 0;
        this.tabIdCounter = 1;
      }
    }
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
    }

    const newTab = this.tabs.find((tab) => tab.id === tabId);
    if (newTab) {
      newTab.iframeEl.style.display = 'block';
      newTab.iframeEl.style.opacity = 1;
      newTab.iframeEl.style.zIndex = 1;
      this.activeTabId = tabId;
      this.onTabChange(tabId);
    }

    this.renderTabBar();
  }

  handleTabClose(tabId) {
    this.removeTab(tabId);
  }

  handleTabClick(tabId) {
    this.switchTab(tabId);
  }

  handleNewTab() {
    this.addTab({ url: '' });
  }

  renderNewTabButton() {
    const newTabButton = document.createElement('button');
    newTabButton.classList.add('new-tab-button');
    newTabButton.textContent = '+';
    this.tabBarElement.appendChild(newTabButton);
  }

  renderTabBar() {
    const tabElements = this.tabBarElement.children;
    for (let i = 0; i < tabElements.length; i++) {
      const tabElement = tabElements[i];
      if (tabElement.classList.contains('tab')) {
        if (this.tabs.find((tab) => tab.id === i)) {
          tabElement.classList.remove('active');
        } else {
          tabElement.remove();
          i--;
        }
      }
    }

    for (let i = 0; i < this.tabs.length; i++) {
      const tab = this.tabs[i];
      const tabElement = this.tabBarElement.children[i];
      if (tab.id === this.activeTabId) {
        tabElement.classList.add('active');
      } else {
        tabElement.classList.remove('active');
      }
    }
  }
}