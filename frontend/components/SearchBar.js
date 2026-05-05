import { useState, useEffect } from 'react';

export class SearchBar {
  constructor({ onSearchQuery, tabManager, swConfig }) {
    this.onSearchQuery = onSearchQuery;
    this.tabManager = tabManager;
    this.swConfig = swConfig;
    this.state = {
      searchQuery: '',
      focused: false,
      searchEngine: 'google',
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
    this.searchForm.className = 'search-bar';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.value = this.state.searchQuery;
    this.searchInput.onchange = this.handleInputChange;
    this.searchInput.onfocus = this.handleFocus;
    this.searchInput.onblur = this.handleBlur;
    this.searchInput.placeholder = 'Search or enter a URL...';
    this.searchInput.className = 'search-input';

    this.searchEngineSelect = document.createElement('select');
    this.searchEngineSelect.value = this.state.searchEngine;
    this.searchEngineSelect.onchange = this.handleSearchEngineChange;
    this.searchEngineSelect.className = 'search-engine-select';

    const googleOption = document.createElement('option');
    googleOption.value = 'google';
    googleOption.textContent = 'Google';
    this.searchEngineSelect.appendChild(googleOption);

    const bingOption = document.createElement('option');
    bingOption.value = 'bing';
    bingOption.textContent = 'Bing';
    this.searchEngineSelect.appendChild(bingOption);

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

  handleSearchEngineChange(event) {
    this.state.searchEngine = event.target.value;
    localStorage.setItem('searchEngine', this.state.searchEngine);
  }
}