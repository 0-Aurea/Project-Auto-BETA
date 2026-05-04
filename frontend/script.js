import React from 'react';
import ReactDOM from 'react-dom';
import './style.css';
import SearchBar from './components/SearchBar';
import TabBar from './components/TabBar';
import SettingsPanel from './components/SettingsPanel';
import ProxyHistory from './components/ProxyHistory';
import BookmarksManager from './components/BookmarksManager';

const App = () => {
  return (
    <div className="app">
      <SearchBar />
      <TabBar />
      <SettingsPanel />
      <ProxyHistory />
      <BookmarksManager />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));

navigator.serviceWorker.register('sw.js')
  .then(registration => {
    console.log('Service worker registered:', registration);
  })
  .catch(error => {
    console.error('Service worker registration failed:', error);
  });

window.addEventListener('message', event => {
  if (event.data.type === 'proxy-message') {
    const { tabId, message } = event.data;
    // Handle messages from the proxy
  }
});

window.addEventListener('beforeunload', () => {
  // Clean up before unloading the page
  navigator.serviceWorker.controller.postMessage({ type: 'shutdown' });
});

function connectToProxy() {
  // Establish a connection to the proxy
  const proxyUrl = 'http://localhost:8080'; // Replace with the actual proxy URL
  const connection = new WebSocket(proxyUrl);

  connection.onmessage = event => {
    console.log('Received message from proxy:', event.data);
  };

  connection.onopen = () => {
    console.log('Connected to proxy');
  };

  connection.onerror = error => {
    console.error('Error connecting to proxy:', error);
  };

  connection.onclose = () => {
    console.log('Disconnected from proxy');
  };
}

connectToProxy();

function handleSearchQuery(searchQuery) {
  // Handle search queries from the search bar
  const searchEngine = localStorage.getItem('searchEngine');
  let url;
  if (searchEngine === 'google') {
    url = `https://www.google.com/search?q=${searchQuery}`;
  } else if (searchEngine === 'bing') {
    url = `https://www.bing.com/search?q=${searchQuery}`;
  } else {
    // Default to Google
    url = `https://www.google.com/search?q=${searchQuery}`;
  }

  // Open the search results in a new tab
  window.open(url, '_blank');
}

function handleTabChange(tabId) {
  // Handle tab changes
  const tab = document.getElementById(`tab-${tabId}`);
  tab.classList.add('active');
}

function handleSettingsChange(settings) {
  // Handle settings changes
  localStorage.setItem('encodingMode', settings.encodingMode);
  localStorage.setItem('cacheEnabled', settings.cacheEnabled);
  localStorage.setItem('adBlockEnabled', settings.adBlockEnabled);
}

function handleProxyHistoryChange(history) {
  // Handle proxy history changes
  localStorage.setItem('proxyHistory', JSON.stringify(history));
}

function handleBookmarksChange(bookmarks) {
  // Handle bookmarks changes
  localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
}