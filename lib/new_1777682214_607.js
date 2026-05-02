// lib/new_1777682214_607.js

/**
 * A simple utility module for basic string manipulations.
 */

const StringUtils = {
  /**
   * Capitalizes the first letter of a given string.
   * @param {string} str The input string.
   * @returns {string} The string with its first letter capitalized.
   */
  capitalizeFirstLetter: (str) => {
    if (typeof str !== 'string' || str.length === 0) {
      return '';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Reverses a given string.
   * @param {string} str The input string.
   * @returns {string} The reversed string.
   */
  reverseString: (str) => {
    if (typeof str !== 'string') {
      throw new TypeError('Input must be a string.');
    }
    return str.split('').reverse().join('');
  },

  /**
   * Checks if a string is a palindrome.
   * @param {string} str The input string.
   * @returns {boolean} True if the string is a palindrome, false otherwise.
   */
  isPalindrome: (str) => {
    if (typeof str !== 'string') {
      throw new TypeError('Input must be a string.');
    }
    const cleanedStr = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const reversedStr = StringUtils.reverseString(cleanedStr);
    return cleanedStr === reversedStr;
  }
};

module.exports = StringUtils;