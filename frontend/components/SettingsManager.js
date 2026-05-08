export class SettingsManager {
  constructor({ settingsPanelElement }) {
    this.settingsPanelElement = settingsPanelElement;
    this.state = {
      adBlockEnabled: localStorage.getItem('adBlockEnabled') !== 'false',
      darkModeEnabled: localStorage.getItem('darkModeEnabled') !== 'false',
      searchEngine: localStorage.getItem('searchEngine') || 'google',
    };

    this.renderSettingsPanel = this.renderSettingsPanel.bind(this);
    this.handleAdBlockToggle = this.handleAdBlockToggle.bind(this);
    this.handleDarkModeToggle = this.handleDarkModeToggle.bind(this);
    this.handleSearchEngineChange = this.handleSearchEngineChange.bind(this);

    this.initSettingsPanel();
  }

  initSettingsPanel() {
    this.renderSettingsPanel();
    document.getElementById('settings-toggle').addEventListener('click', () => {
      this.settingsPanelElement.classList.toggle('open');
      document.body.classList.toggle('settings-open', this.settingsPanelElement.classList.contains('open'));
    });
  }

  renderSettingsPanel() {
    this.settingsPanelElement.className = 'settings-panel glass-card';
    this.settingsPanelElement.innerHTML = `
      <div class="settings-header">Settings</div>
      <div class="settings-group">
        <div class="settings-toggle">
          <label class="switch-pill">
            <input type="checkbox" id="ad-block-toggle" ${this.state.adBlockEnabled ? 'checked' : ''}>
            <span class="slider-pill round"></span>
          </label>
          <span>Ad Block</span>
        </div>
        <div class="settings-toggle">
          <label class="switch-pill">
            <input type="checkbox" id="dark-mode-toggle" ${this.state.darkModeEnabled ? 'checked' : ''}>
            <span class="slider-pill round"></span>
          </label>
          <span>Dark Mode</span>
        </div>
      </div>
      <div class="settings-group">
        <label for="search-engine-select">Search Engine:</label>
        <select id="search-engine-select" class="select-input">
          <option value="google" ${this.state.searchEngine === 'google' ? 'selected' : ''}>Google</option>
          <option value="bing" ${this.state.searchEngine === 'bing' ? 'selected' : ''}>Bing</option>
        </select>
      </div>
    `;

    document.getElementById('ad-block-toggle').addEventListener('change', this.handleAdBlockToggle);
    document.getElementById('dark-mode-toggle').addEventListener('change', this.handleDarkModeToggle);
    document.getElementById('search-engine-select').addEventListener('change', this.handleSearchEngineChange);

    if (this.state.darkModeEnabled) {
      document.body.classList.add('dark-mode');
    }

    this.settingsPanelElement.addEventListener('click', (event) => {
      if (event.target === this.settingsPanelElement) {
        this.settingsPanelElement.classList.remove('open');
        document.body.classList.remove('settings-open');
      }
    });
  }

  handleAdBlockToggle(event) {
    this.state.adBlockEnabled = event.target.checked;
    localStorage.setItem('adBlockEnabled', this.state.adBlockEnabled);
  }

  handleDarkModeToggle(event) {
    this.state.darkModeEnabled = event.target.checked;
    localStorage.setItem('darkModeEnabled', this.state.darkModeEnabled);
    document.body.classList.toggle('dark-mode', this.state.darkModeEnabled);
  }

  handleSearchEngineChange(event) {
    this.state.searchEngine = event.target.value;
    localStorage.setItem('searchEngine', this.state.searchEngine);
  }
}