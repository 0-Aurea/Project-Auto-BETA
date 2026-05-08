export class SearchBar {
  constructor({ onSearchQuery, tabManager, swConfig, searchBarElement }) {
    this.onSearchQuery = onSearchQuery;
    this.tabManager = tabManager;
    this.swConfig = swConfig;
    this.searchBarElement = searchBarElement;
    this.state = {
      searchQuery: '',
      focused: false,
      searchEngine: localStorage.getItem('searchEngine') || 'google',
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

    this.searchBarElement.appendChild(this.searchForm);

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch(e);
      }
    });
  }

  unrender() {
    this.searchForm.remove();
  }

  handleSearch(event) {
    event.preventDefault();
    const searchValue = this.searchInput.value.trim();
    if (searchValue) {
      let url;
      if (searchValue.startsWith('http')) {
        url = searchValue;
      } else {
        const searchEngines = {
          google: 'https://www.google.com/search?q=',
          bing: 'https://www.bing.com/search?q=',
        };
        url = searchEngines[this.state.searchEngine] + encodeURIComponent(searchValue);
      }
      const encodedUrl = this.swConfig.encode(url);
      this.tabManager.addTab({ url: encodedUrl, title: searchValue, favicon: '' });
      this.searchInput.value = '';
      localStorage.setItem('searchEngine', this.state.searchEngine);
    }
  }

  handleInputChange(event) {
    this.state.searchQuery = event.target.value;
  }

  handleFocus() {
    this.state.focused = true;
    this.searchInput.classList.add('focused');
    this.searchForm.classList.add('focused');
  }

  handleBlur() {
    this.state.focused = false;
    this.searchInput.classList.remove('focused');
    this.searchForm.classList.remove('focused');
  }

  handleSearchEngineChange(engine) {
    this.state.searchEngine = engine;
    localStorage.setItem('searchEngine', engine);
    const options = this.searchEngineSelect.children;
    for (const option of options) {
      option.classList.remove('active');
    }
    this.searchEngineSelect.children[engine === 'google' ? 0 : 1].classList.add('active');
    this.searchEngineSelect.classList.remove(`active-google`, `active-bing`);
    this.searchEngineSelect.classList.add(`active-${engine}`);
  }
}