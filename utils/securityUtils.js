/**
 * Security utility class for handling advanced security-related tasks.
 */
class SecurityUtils {
  /**
   * Sanitizes HTML to prevent XSS attacks.
   * @param {string} html - The HTML code to sanitize.
   * @returns {string} The sanitized HTML code.
   */
  static sanitizeHtml(html) {
    const DOMParser = require('dom-parser');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const elements = doc.getElementsByTagName('*');

    // Remove all script and style elements
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
        element.parentNode.removeChild(element);
      }
    }

    // Remove all inline event handlers
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      for (let j = 0; j < element.attributes.length; j++) {
        const attribute = element.attributes[j];
        if (attribute.name.startsWith('on')) {
          element.removeAttribute(attribute.name);
        }
      }
    }

    // Remove all comments
    const commentRegex = /<!--.*?-->/g;
    html = doc.documentElement.outerHTML.replace(commentRegex, '');

    // Remove all disallowed tags
    const disallowedTags = ['iframe', 'frame', 'frameset', 'object', 'embed'];
    for (const tag of disallowedTags) {
      const tags = doc.getElementsByTagName(tag);
      for (let i = tags.length - 1; i >= 0; i--) {
        const element = tags[i];
        element.parentNode.removeChild(element);
      }
    }

    // Remove all disallowed attributes
    const disallowedAttributes = ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout'];
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      for (let j = 0; j < element.attributes.length; j++) {
        const attribute = element.attributes[j];
        if (disallowedAttributes.includes(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      }
    }

    return doc.documentElement.outerHTML;
  }

  /**
   * Manages Content Security Policy (CSP) headers.
   */
  static CSPUtils = {
    /**
     * Default CSP policy.
     */
    defaultPolicy: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'child-src': ["'none'"],
    },

    /**
     * Merges two CSP policies.
     * @param {object} policy1 - The first CSP policy.
     * @param {object} policy2 - The second CSP policy.
     * @returns {object} The merged CSP policy.
     */
    mergePolicies(policy1, policy2) {
      const mergedPolicy = { ...policy1 };
      for (const directive in policy2) {
        if (!mergedPolicy[directive]) {
          mergedPolicy[directive] = policy2[directive];
        } else {
          mergedPolicy[directive] = [...new Set([...mergedPolicy[directive], ...policy2[directive]])];
        }
      }
      return mergedPolicy;
    },

    /**
     * Converts a CSP policy to a header string.
     * @param {object} policy - The CSP policy.
     * @returns {string} The CSP header string.
     */
    policyToHeader(policy) {
      const header = [];
      for (const directive in policy) {
        header.push(`${directive} ${policy[directive].join(' ')}`);
      }
      return header.join('; ');
    },

    /**
     * Validates a CSP policy.
     * @param {object} policy - The CSP policy.
     * @returns {boolean} True if the policy is valid, false otherwise.
     */
    validatePolicy(policy) {
      const allowedDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'object-src',
        'frame-src',
        'child-src',
        'connect-src',
        'font-src',
        'img-src',
        'media-src',
        'worker-src',
      ];

      for (const directive in policy) {
        if (!allowedDirectives.includes(directive)) {
          return false;
        }

        for (const source of policy[directive]) {
          if (!source.startsWith("'") && !source.startsWith('http')) {
            return false;
          }
        }
      }

      return true;
    },
  };

  /**
   * Validates and rewrites URLs to prevent SSRF attacks.
   * @param {string} url - The URL to validate and rewrite.
   * @param {string} baseUrl - The base URL of the proxied resource.
   * @returns {string} The validated and rewritten URL.
   */
  static validateAndRewriteUrl(url, baseUrl) {
    const { URL } = require('url');
    const parsedUrl = new URL(url, baseUrl);

    // Check if the URL is relative
    if (!parsedUrl.protocol) {
      return url;
    }

    // Check if the URL is a valid HTTP/HTTPS URL
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Invalid URL protocol');
    }

    // Check if the URL has a valid hostname
    if (!parsedUrl.hostname) {
      throw new Error('Invalid URL hostname');
    }

    // Rewrite the URL to prevent SSRF attacks
    return `${parsedUrl.protocol}://${parsedUrl.host}${parsedUrl.pathname}`;
  }

  /**
   * Generates a random salt for XOR encoding.
   * @returns {string} A random salt.
   */
  static generateSalt() {
    return Math.random().toString(36).substr(2, 10);
  }

  /**
   * XOR encodes a string using a salt.
   * @param {string} str - The string to encode.
   * @param {string} salt - The salt to use.
   * @returns {string} The XOR encoded string.
   */
  static xorEncode(str, salt) {
    let encodedStr = '';
    for (let i = 0; i < str.length; i++) {
      encodedStr += String.fromCharCode(str.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return encodedStr;
  }

  /**
   * XOR decodes a string using a salt.
   * @param {string} str - The string to decode.
   * @param {string} salt - The salt to use.
   * @returns {string} The XOR decoded string.
   */
  static xorDecode(str, salt) {
    return SecurityUtils.xorEncode(str, salt);
  }

  /**
   * Base64 encodes a string.
   * @param {string} str - The string to encode.
   * @returns {string} The base64 encoded string.
   */
  static base64Encode(str) {
    return Buffer.from(str).toString('base64');
  }

  /**
   * Base64 decodes a string.
   * @param {string} str - The string to decode.
   * @returns {string} The base64 decoded string.
   */
  static base64Decode(str) {
    return Buffer.from(str, 'base64').toString();
  }
}

module.exports = SecurityUtils;