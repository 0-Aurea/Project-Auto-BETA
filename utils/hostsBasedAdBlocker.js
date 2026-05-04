const fs = require('fs');
const { AD_BLOCK_FILTER_LIST_URL } = require('./constants');

/**
 * Hosts-based ad blocker utility class for filtering out unwanted ads and trackers.
 */
class HostsBasedAdBlocker {
  /**
   * Filter list URL for ad blocking.
   */
  static filterListUrl = AD_BLOCK_FILTER_LIST_URL;

  /**
   * Filter list data.
   */
  static filterListData = [];

  /**
   * Initialize the hosts-based ad blocker.
   * @returns {Promise<void>} A promise that resolves when the ad blocker is initialized.
   */
  static async init() {
    try {
      const response = await fetch(HostsBasedAdBlocker.filterListUrl);
      const filterListContent = await response.text();
      HostsBasedAdBlocker.filterListData = filterListContent.split('\n').map((line) => line.trim());
    } catch (error) {
      console.error('Error initializing hosts-based ad blocker:', error);
    }
  }

  /**
   * Checks if a URL is blocked by the ad blocker.
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is blocked, false otherwise.
   */
  static isUrlBlocked(url) {
    const { hostname } = new URL(url);
    return HostsBasedAdBlocker.filterListData.includes(hostname);
  }

  /**
   * Checks if a request should be blocked by the ad blocker.
   * @param {Object} request - The request object.
   * @param {string} request.url - The request URL.
   * @returns {boolean} True if the request should be blocked, false otherwise.
   */
  static shouldBlockRequest(request) {
    return HostsBasedAdBlocker.isUrlBlocked(request.url);
  }
}

// Initialize the ad blocker
HostsBasedAdBlocker.init();

module.exports = HostsBasedAdBlocker;