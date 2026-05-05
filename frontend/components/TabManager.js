import { encode } from '../sw-config.js';
import TabBar from './TabBar.js';

class TabManager {
  constructor() {
    this.tabs = [];
    this.activeTab = null;
    this.viewport = document.getElementById('viewport');
    this.tabBarElement = document.getElementById('tab-bar');
    this.addEventListeners();
    this.loadTabs();
  }

  addEventListeners() {
    document.getElementById('new-tab-button').addEventListener('click', () => this.addTab());
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 't') {
        this.addTab();
      } else if (event.ctrlKey && event.key === 'w' && this.activeTab) {
        this.removeTab(this.activeTab.id);
      } else if (event.ctrlKey && event.key === 'l') {
        document.getElementById('search-bar').focus();
      }
    });
  }

  loadTabs() {
    const storedTabs = localStorage.getItem('tabs');
    if (storedTabs) {
      this.tabs = JSON.parse(storedTabs).map((tab) => ({ ...tab, iframeEl: null }));
      this.activeTab = this.tabs[0];
      this.renderTabs();
    } else {
      this.addTab();
    }
  }

  saveTabs() {
    localStorage.setItem('tabs', JSON.stringify(this.tabs.map(({ iframeEl, ...tab }) => tab)));
  }

  addTab(url = '') {
    const newTab = {
      id: Date.now(),
      url,
      title: '',
      icon: '',
      iframeEl: null,
    };
    this.tabs.push(newTab);
    this.activeTab = newTab;
    this.renderTabs();
    this.saveTabs();
    this.loadTabContent(newTab);
  }

  removeTab(id) {
    const index = this.tabs.findIndex((tab) => tab.id === id);
    if (index !== -1) {
      this.tabs.splice(index, 1);
      if (this.activeTab.id === id) {
        this.activeTab = this.tabs[index] || this.tabs[index - 1] || null;
      }
      this.renderTabs();
      this.saveTabs();
    }
  }

  updateTab(id, url, title, icon) {
    const tab = this.tabs.find((tab) => tab.id === id);
    if (tab) {
      tab.url = url;
      tab.title = title;
      tab.icon = icon;
      this.renderTabs();
      this.saveTabs();
    }
  }

  renderTabs() {
    this.tabBarElement.innerHTML = '';
    this.tabs.forEach((tab) => {
      const tabElement = document.createElement('div');
      tabElement.classList.add('tab');
      tabElement.innerHTML = `
        <img src="${tab.icon || 'https://example.com/globe.png'}" alt="${tab.title}">
        <span>${tab.title || 'New Tab'}</span>
        <button class="close-tab">×</button>
      `;
      tabElement.addEventListener('click', () => {
        this.activeTab = tab;
        this.renderTabs();
        this.loadTabContent(tab);
      });
      tabElement.querySelector('.close-tab').addEventListener('click', (event) => {
        event.stopPropagation();
        this.removeTab(tab.id);
      });
      if (tab === this.activeTab) {
        tabElement.classList.add('active');
      }
      this.tabBarElement.appendChild(tabElement);
    });
    if (this.activeTab) {
      this.viewport.innerHTML = '';
      this.viewport.appendChild(this.activeTab.iframeEl || document.createElement('iframe'));
    }
  }

  loadTabContent(tab) {
    if (!tab.iframeEl) {
      tab.iframeEl = document.createElement('iframe');
      tab.iframeEl.src = encode(tab.url);
      tab.iframeEl.onload = () => {
        tab.title = tab.iframeEl.contentDocument.title;
        tab.icon = tab.iframeEl.contentDocument.querySelector('link[rel="icon"]')?.href;
        this.renderTabs();
      };
      this.viewport.appendChild(tab.iframeEl);
    } else {
      tab.iframeEl.src = encode(tab.url);
    }
  }
}

export { TabManager };