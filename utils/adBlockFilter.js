const fs = require('fs');
const { URL } = require('url');

/**
 * Ad block filter utility class for handling ad block filter lists and integrating with the settings panel.
 */
class AdBlockFilterUtils {
  /**
   * Filter list data.
   */
  static filterList = [];

  /**
   * Regular expression to match ad block filter patterns.
   */
  static FILTER_REGEX = /^([a-zA-Z0-9.-]+)\s+(.*)$/;

  /**
   * Loads the ad block filter list from a file.
   * @param {string} filePath - The path to the filter list file.
   */
  static loadFilterList(filePath) {
    try {
      const filterListContent = fs.readFileSync(filePath, 'utf8');
      const filterListLines = filterListContent.split('\n');

      filterListLines.forEach((line) => {
        const match = line.match(AdBlockFilterUtils.FILTER_REGEX);
        if (match) {
          AdBlockFilterUtils.filterList.push({
            domain: match[1],
            pattern: match[2],
          });
        }
      });
    } catch (error) {
      globalThis.console.error(`Error loading filter list: ${error.message}`);
    }
  }

  /**
   * Checks if a URL matches the ad block filter list.
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL matches the filter list, false otherwise.
   */
  static isAdBlocked(url) {
    const urlObject = new URL(url);

    for (const filter of AdBlockFilterUtils.filterList) {
      if (urlObject.hostname.includes(filter.domain)) {
        return true;
      }

      try {
        const regex = new RegExp(filter.pattern, 'gi');
        if (regex.test(url)) {
          return true;
        }
      } catch (error) {
        globalThis.console.error(`Error parsing filter pattern: ${error.message}`);
      }
    }

    return false;
  }

  /**
   * Initializes the ad block filter utility.
   * @param {string} filterListPath - The path to the filter list file.
   */
  static init(filterListPath) {
    AdBlockFilterUtils.loadFilterList(filterListPath);
  }
}

module.exports = AdBlockFilterUtils;