/**
 * @fileoverview Manages connection-related operations for the Noodles application.
 * This module handles client-side interaction for initiating port scans, banner grabbing,
 * and managing proxy configurations, delegating complex operations to a backend.
 */

// --- Configuration & State Management ---
/**
 * Stores the current proxy configuration for attacks.
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

// --- API Endpoints ---
const API_ENDPOINTS = {
    PORT_SCAN: '/api/connection/portscan',
    BANNER_GRAB: '/api/connection/bannergrab',
    PROXY_CONFIG: '/api/connection/proxyconfig'
};

// --- Core Utility Functions ---

/**
 * Sends a POST request to the backend API with JSON payload.
 * @param {string} endpoint - The API endpoint path.
 * @param {object} data - The payload to send.
 * @returns {Promise<object>} - A promise resolving with the backend response data.
 * @throws {Error} If the network request fails or the backend returns an error.
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
            let errorMessage = `Backend error: ${response.status} - ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.message) {
                    errorMessage = `Backend error: ${response.status} - ${errorData.message}`;
                }
            } catch (jsonError) {
                // If response is not JSON, use default message
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error(`Request to ${endpoint} failed:`, error);
        throw error;
    }
}

// --- Proxy Management Functions ---

/**
 * Updates the local proxy configuration and sends it to the backend.
 * This configures the backend service to tunnel connection attacks through the specified proxy.
 * @param {object} config - The new proxy configuration object.
 * @returns {Promise<boolean>} - True if configuration was successfully applied by the backend.
 * @throws {Error} If the configuration is invalid or backend application fails.
 */
async function setProxyConfiguration(config) {
    if (!config || typeof config !== 'object') {
        throw new Error('Invalid proxy configuration provided.');
    }
    if (!config.host || !config.port) {
        throw new Error('Proxy host and port are mandatory.');
    }
    if (typeof config.port !== 'number' || config.port < 1 || config.port > 65535) {
        throw new Error('Proxy port must be a valid number between 1 and 65535.');
    }
    if (config.type && !['HTTP', 'SOCKS4', 'SOCKS5'].includes(config.type.toUpperCase())) {
        throw new Error('Invalid proxy type. Supported: HTTP, SOCKS4, SOCKS5.');
    }

    currentProxyConfig = {
        ...currentProxyConfig,
        ...config,
        type: (config.type || currentProxyConfig.type).toUpperCase()
    };

    try {
        await sendToBackend(API_ENDPOINTS.PROXY_CONFIG, currentProxyConfig);
        console.log('Proxy configuration successfully applied to backend.');
        return true;
    } catch (error) {
        console.error('Failed to apply proxy configuration via backend:', error);
        throw new Error(`Proxy configuration failed: ${error.message}`);
    }
}

/**
 * Retrieves the currently active proxy configuration.
 * @returns {object} A copy of the current proxy configuration.
 */
function getProxyConfiguration() {
    return { ...currentProxyConfig };
}

// --- Connection Attack Functions ---

/**
 * Initiates a port scan against the specified target.
 * The scan is executed by the backend, potentially through a configured proxy.
 * @param {string} target - The target URL, domain, or IP address (e.g., 'example.com', '192.168.1.1').
 * @param {string[]} ports - An array of ports or port ranges to scan (e.g., ['80', '443', '22-25', '1-1024']).
 * @returns {Promise<object>} - A promise resolving with the port scan results from the backend.
 * @throws {Error} If target or ports are invalid, or if the backend operation fails.
 */
async function initiatePortScan(target, ports) {
    if (!target || typeof target !== 'string' || target.trim() === '') {
        throw new Error('Valid target URL or IP is required for port scanning.');
    }
    if (!Array.isArray(ports) || ports.length === 0) {
        throw new Error('At least one port or port range is required for scanning.');
    }
    if (!ports.every(p => typeof p === 'string' && p.match(/^(\d{1,5}(-\d{1,5})?)$/))) {
        throw new Error('Invalid port format. Use single ports (e.g., "80") or ranges (e.g., "1-1024").');
    }

    const payload = {
        target: target.trim(),
        ports: ports,
        proxy: getProxyConfiguration()
    };

    try {
        const results = await sendToBackend(API_ENDPOINTS.PORT_SCAN, payload);
        console.log('Port scan initiated. Results received.');
        return results;
    } catch (error) {
        console.error('Failed to initiate port scan:', error);
        throw new Error(`Port scan failed: ${error.message}`);
    }
}

/**
 * Initiates a banner grabbing operation against the specified target.
 * This operation is performed by the backend, potentially through a configured proxy,
 * to retrieve service banners from open ports.
 * @param {string} target - The target URL, domain, or IP address.
 * @returns {Promise<object>} - A promise resolving with banner information from the backend.
 * @throws {Error} If the target is invalid or the backend operation fails.
 */
async function initiateBannerGrab(target) {
    if (!target || typeof target !== 'string' || target.trim() === '') {
        throw new Error('Valid target URL or IP is required for banner grabbing.');
    }

    const payload = {
        target: target.trim(),
        proxy: getProxyConfiguration()
    };

    try {
        const results = await sendToBackend(API_ENDPOINTS.BANNER_GRAB, payload);
        console.log('Banner grab initiated. Results received.');
        return results;
    } catch (error) {
        console.error('Failed to initiate banner grab:', error);
        throw new Error(`Banner grab failed: ${error.message}`);
    }
}

// --- Real-time Statistics Update (Client-side) ---

/**
 * Dispatches a custom event to update the UI with connection attack statistics.
 * This function is intended to be called by a mechanism (e.g., WebSocket listener)
 * that receives real-time stats from the backend.
 * @param {object} stats - Statistics object containing:
 * @param {number} stats.mbps - Megabytes Per Second throughput.
 * @param {number} stats.packetsSent - Number of packets sent.
 * @param {string} stats.targetStatus - Connection status (Online/Offline/Unresponsive).
 * @param {number} stats.timeElapsed - Total time elapsed in seconds.
 */
function updateConnectionStats(stats) {
    if (!stats || typeof stats !== 'object') {
        console.warn('Invalid stats object provided to updateConnectionStats.');
        return;
    }
    if (typeof stats.mbps === 'undefined' || typeof stats.packetsSent === 'undefined' ||
        typeof stats.targetStatus === 'undefined' || typeof stats.timeElapsed === 'undefined') {
        console.warn('Incomplete stats object provided to updateConnectionStats. Missing required properties.');
        return;
    }

    const event = new CustomEvent('connectionStatsUpdate', { detail: stats });
    window.dispatchEvent(event);
}

// --- Public API ---
// Exposes core functionalities to the global window.Noodles object.
window.Noodles = window.Noodles || {};
window.Noodles.Connection = {
    setProxyConfiguration: setProxyConfiguration,
    getProxyConfiguration: getProxyConfiguration,
    initiatePortScan: initiatePortScan,
    initiateBannerGrab: initiateBannerGrab,
    updateConnectionStats: updateConnectionStats
};