'use strict';

/**
 * Utility functions for handling search requests and responses.
 */
class SearchUtils {
  /**
   * Supported search engines.
   */
  static SEARCH_ENGINES = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
  };

  /**
   * Default search engine.
   */
  static DEFAULT_SEARCH_ENGINE = 'google';

  /**
   * Constructs a search URL for a given query and search engine.
   * @param {string} query - The search query.
   * @param {string} [engine=google] - The search engine to use.
   * @returns {string} The constructed search URL.
   */
  static constructSearchUrl(query, engine = SearchUtils.DEFAULT_SEARCH_ENGINE) {
    if (!SearchUtils.SEARCH_ENGINES[engine]) {
      throw new Error(`Unsupported search engine: ${engine}`);
    }
    return SearchUtils.SEARCH_ENGINES[engine] + encodeURIComponent(query);
  }

  /**
   * Extracts the search query from a URL.
   * @param {string} url - The URL to extract the query from.
   * @returns {string} The extracted search query.
   */
  static extractSearchQuery(url) {
    const urlParams = new URL(url).searchParams;
    const query = urlParams.get('q');
    return query ? decodeURIComponent(query) : '';
  }

  /**
   * Validates a search query.
   * @param {string} query - The search query to validate.
   * @returns {boolean} True if the query is valid, false otherwise.
   */
  static isValidSearchQuery(query) {
    return query.trim() !== '';
  }
}

module.exports = SearchUtils;