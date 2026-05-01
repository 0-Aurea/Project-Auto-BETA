/**
 * @fileoverview Manages connection-related attacks and proxy configurations for the Noodles application.
 * This module orchestrates client-side interactions to initiate powerful backend operations for port scanning,
 * banner grabbing, and proxy-tunneled attacks.
 */

// --- Configuration & State Management ---
/**
 * Stores the current proxy configuration.
 * @type {object}
 * @property {string} type - Proxy type (e.g., 'HTTP', 'SOCKS5').
 * @property {string} host - Proxy host address.
 * @property {number} port - Proxy port.
 * @property {string} [username] - Optional proxy username.
 * @property {string} [password] - Optional proxy password.
 */
let currentProxyConfig = {
    type: 'HTTP',
    host: '',
    port: 8080,
    username: '',
    password: ''
};

// --- API Endpoints (Hypothetical Backend) ---
const API_ENDPOINTS = {
    PORT_SCAN: '/api/connection/portscan',
    BANNER_GRAB: '/api/connection/bannergrab',
    PROXY_CONFIG: '/api/connection/proxyconfig'
};

// --- Core Utility Functions ---

/**
 * Sends a request to the backend API.
 * @param {string} endpoint - The API endpoint to target.
 * @param {object} data - The payload to send.
 * @returns {Promise<object>} - A promise resolving with the backend response.
 */
async function sendToBackend(endpoint, data) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Backend error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error sending request to ${endpoint}:`, error);
        throw error;
    }
}

// --- Proxy Management Functions ---

/**
 * Sets the current proxy configuration.
 * This function updates the local state and conceptually sends the configuration
 * to a backend service that would actually manage the proxy tunneling.
 * @param {object} config - The new proxy configuration.
 * @returns {Promise<boolean>} - True if configuration was conceptually applied successfully.
 */
async function setProxyConfiguration(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid proxy configuration object provided.');
    }
    if (!config.host || !config.port) {
        throw new Error('Proxy host and port are required.');
    }

    currentProxyConfig = { ...currentProxyConfig, ...config };
    console.log('Proxy configuration updated locally.');

    try {
        const response = await sendToBackend(API_ENDPOINTS.PROXY_CONFIG, currentProxyConfig);
        console.log('Backend acknowledged proxy configuration.');
        return true;
    } catch (error) {
        console.error('Failed to apply proxy configuration via backend:', error);
        throw new Error(`Failed to apply proxy configuration: ${error.message}`);
    }
}

/**
 * Retrieves the currently active proxy configuration.
 * @returns {object} The current proxy configuration.
 */
function getProxyConfiguration() {
    return { ...currentProxyConfig };
}

// --- Connection Attack Functions ---

/**
 * Initiates a port scan against the target using the configured proxy.
 * This operation is performed by a powerful backend service.
 * @param {string} target - The URL or IP address of the target.
 * @param {string[]} ports - An array of ports to scan (e.g., ['80', '443', '22-25']).
 * @returns {Promise<object>} - A promise resolving with scan results from the backend.
 */
async function initiatePortScan(target, ports) {
    if (!target) {
        throw new Error('Target URL or IP is required for port scanning.');
    }
    if (!Array.isArray(ports) || ports.length === 0) {
        throw new Error('At least one port or port range is required for scanning.');
    }

    const payload = {
        target: target,
        ports: ports,
        proxy: getProxyConfiguration()
    };

    try {
        const results = await sendToBackend(API_ENDPOINTS.PORT_SCAN, payload);
        console.log('Port scan initiated. Results received.');
        return results;
    } catch (error) {
        console.error('Failed to initiate port scan:', error);
        throw new Error(`Failed to initiate port scan: ${error.message}`);
    }
}

/**
 * Initiates a banner grabbing operation against the target using the configured proxy.
 * This operation is performed by a powerful backend service.
 * @param {string} target - The URL or IP address of the target.
 * @returns {Promise<object>} - A promise resolving with banner information from the backend.
 */
async function initiateBannerGrab(target) {
    if (!target) {
        throw new Error('Target URL or IP is required for banner grabbing.');
    }

    const payload = {
        target: target,
        proxy: getProxyConfiguration()
    };

    try {
        const results = await sendToBackend(API_ENDPOINTS.BANNER_GRAB, payload);
        console.log('Banner grab initiated. Results received.');
        return results;
    } catch (error) {
        console.error('Failed to initiate banner grab:', error);
        throw new Error(`Failed to initiate banner grab: ${error.message}`);
    }
}

// --- Real-time Statistics Update (Client-side) ---

/**
 * Dispatches a custom event to update the UI with connection attack statistics.
 * This function expects data from a source (e.g., backend via WebSocket or polling).
 * `public/script.js` should listen for this event to update the DOM.
 * @param {object} stats - Statistics object.
 * @param {number} stats.mbps - Megabytes Per Second throughput.
 * @param {number} stats.packetsSent - Number of packets sent.
 * @param {string} stats.targetStatus - Connection status (Online/Offline/Unresponsive).
 * @param {number} stats.timeElapsed - Total time elapsed in seconds.
 */
function updateConnectionStats(stats) {
    console.log('Dispatching connection stats update event.');
    const event = new CustomEvent('connectionStatsUpdate', { detail: stats });
    window.dispatchEvent(event);
}

// --- Public API ---
window.Noodles = window.Noodles || {};
window.Noodles.Connection = {
    setProxyConfiguration: setProxyConfiguration,
    getProxyConfiguration: getProxyConfiguration,
    initiatePortScan: initiatePortScan,
    initiateBannerGrab: initiateBannerGrab,
    updateConnectionStats: updateConnectionStats
};