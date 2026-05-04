import React from 'react';
import ReactDOM from 'react-dom';
import TabManager from './components/TabManager';
import ProxySettings from './components/ProxySettings';
import ProxyHistory from './components/ProxyHistory';
import BookmarksManager from './components/BookmarksManager';
import SettingsPanel from './components/SettingsPanel';
import './style.css';

const App = () => {
  return (
    <div className="app-container">
      <TabManager />
      <ProxySettings />
      <ProxyHistory />
      <BookmarksManager />
      <SettingsPanel />
    </div>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Service Worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('sw.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
} else {
  console.log('Service Worker is not supported.');
}

// Handle messages from Service Worker
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'updateTab') {
    const tabId = event.data.tabId;
    const tabUrl = event.data.tabUrl;
    // Update tab URL in TabManager
    TabManager.updateTab(tabId, tabUrl);
  } else if (event.data.type === 'addHistory') {
    const historyItem = event.data.historyItem;
    // Add history item in ProxyHistory
    ProxyHistory.addHistory(historyItem);
  }
});

// Initialize proxy connection
const proxyUrl = '/proxy';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Send a test request to the proxy to ensure it's working
fetch(proxyUrl, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then((response) => response.json())
  .then((data) => {
    if (data.success) {
      console.log('Proxy connection established.');
    } else {
      console.error('Proxy connection failed:', data.error);
    }
  })
  .catch((error) => {
    console.error('Proxy connection failed:', error);
  });

// Handle tab updates
TabManager.addEventListener('tabUpdated', (tabId, tabUrl) => {
  // Send a message to the Service Worker to update the tab URL
  navigator.serviceWorker.controller.postMessage({
    type: 'updateTab',
    tabId,
    tabUrl,
  });
});

// Handle history updates
ProxyHistory.addEventListener('historyUpdated', (historyItem) => {
  // Send a message to the Service Worker to add the history item
  navigator.serviceWorker.controller.postMessage({
    type: 'addHistory',
    historyItem,
  });
});