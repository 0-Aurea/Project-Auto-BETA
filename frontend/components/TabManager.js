import { encode } from '../sw-config.js';

export class TabManager {
  constructor({ tabBarElement, viewportElement, onTabChange, searchBarElement, swConfig }) {
    this.tabBarElement = tabBarElement;
    this.viewportElement = viewportElement;
    this.onTabChange = onTabChange;
    this.searchBarElement = searchBarElement;
    this.swConfig = swConfig;
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
        this.switchTab(0);
      }
    } else {
      this.addTab();
    }
  }

  addTab({ url = '', title = '', favicon = '' } = {}) {
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
    return tabId;
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
              <button id="search-button">Go</button>
              <div class="search-engines">
                <button class="search-engine" data-engine="google">Google</button>
                <button class="search-engine" data-engine="bing">Bing</button>
              </div>
            </form>
          </div>
        `;
        this.searchBarElement = document.getElementById('search-form');
        this.searchBarElement.addEventListener('submit', (e) => {
          e.preventDefault();
          const searchQuery = document.getElementById('search-input').value;
          const searchEngine = document.querySelector('.search-engine.active').getAttribute('data-engine');
          const url = `https://${searchEngine}.com/search?q=${searchQuery}`;
          this.addTab({ url });
        });
      }
    }

    this.renderTabBar();
  }

  switchTab(tabId) {
    if (this.activeTabId === tabId) return;

    const oldTab = this.tabs.find((tab) => tab.id === this.activeTabId);
    if (oldTab) {
      oldTab.iframeEl.style.opacity = 0;
      oldTab.iframeEl.style.zIndex = -1;
      const oldTabElement = this.tabBarElement.children[this.tabs.findIndex((tab) => tab.id === this.activeTabId)];
      oldTabElement.classList.remove('active');
    }

    const newTab = this.tabs.find((tab) => tab.id === tabId);
    newTab.iframeEl.style.opacity = 1;
    newTab.iframeEl.style.zIndex = 1;
    const newTabElement = this.tabBarElement.children[this.tabs.findIndex((tab) => tab.id === tabId)];
    newTabElement.classList.add('active');

    this.activeTabId = tabId;
    this.onTabChange(tabId);
  }

  handleTabClose(tabId) {
    this.removeTab(tabId);
  }

  handleTabClick(tabId) {
    this.switchTab(tabId);
  }

  handleNewTab() {
    this.addTab();
  }

  renderNewTabButton() {
    const newTabButton = document.createElement('button');
    newTabButton.classList.add('new-tab-button');
    newTabButton.textContent = '+';
    this.tabBarElement.appendChild(newTabButton);
  }

  renderTabBar() {
    this.tabs.forEach((tab, index) => {
      const tabElement = this.tabBarElement.children[index];
      tabElement.querySelector('.tab-favicon').src = tab.favicon || 'https://example.com/globe-emoji.png';
      tabElement.querySelector('.tab-title').textContent = tab.title || 'Untitled';
    });
  }
}