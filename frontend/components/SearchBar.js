import { useState, useEffect } from 'react';

export class SearchBar {
  constructor({ onSearchQuery, tabManager, swConfig }) {
    this.onSearchQuery = onSearchQuery;
    this.tabManager = tabManager;
    this.swConfig = swConfig;
    this.state = {
      searchQuery: '',
      focused: false,
      searchEngine: localStorage.getItem('searchEngine') || 'google',
      showSearchHero: true,
    };

    this.searchInput = null;
    this.searchForm = null;
    this.searchEngineSelect = null;

    this.handleSearch = this.handleSearch.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleSearchEngineChange = this.handleSearchEngineChange.bind(this);
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.unrender();
  }

  render() {
    this.searchForm = document.createElement('form');
    this.searchForm.onsubmit = this.handleSearch;
    this.searchForm.className = 'search-bar glass-card';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.value = this.state.searchQuery;
    this.searchInput.onchange = this.handleInputChange;
    this.searchInput.onfocus = this.handleFocus;
    this.searchInput.onblur = this.handleBlur;
    this.searchInput.placeholder = 'Search or enter a URL...';
    this.searchInput.className = 'search-input';

    this.searchEngineSelect = document.createElement('div');
    this.searchEngineSelect.className = 'search-engine-select';

    const googleOption = document.createElement('button');
    googleOption.classList.add('search-engine-option', this.state.searchEngine === 'google' ? 'active' : '');
    googleOption.textContent = 'Google';
    googleOption.onclick = () => this.handleSearchEngineChange('google');
    this.searchEngineSelect.appendChild(googleOption);

    const bingOption = document.createElement('button');
    bingOption.classList.add('search-engine-option', this.state.searchEngine === 'bing' ? 'active' : '');
    bingOption.textContent = 'Bing';
    bingOption.onclick = () => this.handleSearchEngineChange('bing');
    this.searchEngineSelect.appendChild(bingOption);

    const slider = document.createElement('div');
    slider.classList.add('search-engine-slider', `active-${this.state.searchEngine}`);
    this.searchEngineSelect.appendChild(slider);

    const searchButton = document.createElement('button');
    searchButton.type = 'submit';
    searchButton.textContent = 'Go';
    searchButton.className = 'search-button';

    this.searchForm.appendChild(this.searchInput);
    this.searchForm.appendChild(this.searchEngineSelect);
    this.searchForm.appendChild(searchButton);

    document.getElementById('search-bar-container').appendChild(this.searchForm);
  }

  unrender() {
    this.searchForm.remove();
  }

  handleSearch(event) {
    event.preventDefault();
    const searchValue = this.searchInput.value.trim();
    if (searchValue) {
      const encodedUrl = this.swConfig.encode(searchValue);
      this.tabManager.navigate(encodedUrl);
      this.searchInput.value = '';
    }
  }

  handleInputChange(event) {
    this.searchInput.value = event.target.value;
  }

  handleFocus() {
    this.state.focused = true;
    this.searchInput.classList.add('focused');
  }

  handleBlur() {
    this.state.focused = false;
    this.searchInput.classList.remove('focused');
  }

  handleSearchEngineChange(engine) {
    this.state.searchEngine = engine;
    localStorage.setItem('searchEngine', this.state.searchEngine);
    const options = this.searchEngineSelect.children;
    for (const option of options) {
      option.classList.remove('active');
    }
    options[engine === 'google' ? 0 : 1].classList.add('active');
    this.searchEngineSelect.children[2].classList.remove(`active-google`, `active-bing`);
    this.searchEngineSelect.children[2].classList.add(`active-${engine}`);
  }
}