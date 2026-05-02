content: // lib/new_1777682214_607.js

/**
 * A comprehensive utility module for string manipulations and common string checks.
 */

const StringUtils = {
  /**
   * Capitalizes the first letter of a given string.
   * If the input is not a string or is empty, returns an empty string.
   * @param {string} str The input string.
   * @returns {string} The string with its first letter capitalized, or an empty string.
   */
  capitalizeFirstLetter: (str) => {
    if (typeof str !== 'string