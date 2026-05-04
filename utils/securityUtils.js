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
     * Validates a CSP policy.
     * @param {object} policy - The CSP policy to validate.
     * @returns {boolean} True if the policy is valid, false otherwise.
     */
    validatePolicy(policy) {
      const requiredDirectives = ['default-src', 'script-src', 'style-src', 'object-src', 'frame-src', 'child-src'];
      for (const directive of requiredDirectives) {
        if (!policy[directive]) {
          return false;
        }
      }
      return true;
    },
  };

  /**
   * Validates a TLS certificate.
   * @param {string} cert - The TLS certificate to validate.
   * @returns {boolean} True if the certificate is valid, false otherwise.
   */
  static validateTlsCertificate(cert) {
    try {
      const tls = require('tls');
      const crypto = require('crypto');
      const certBuffer = Buffer.from(cert, 'utf8');
      const parsedCert = crypto.parseCert(certBuffer);
      const now = new Date();
      if (parsedCert.notBefore > now || parsedCert.notAfter < now) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a URL is secure (HTTPS).
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is secure, false otherwise.
   */
  static isUrlSecure(url) {
    try {
      const { URL } = require('url');
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Generates a random salt for XOR encoding.
   * @returns {string} A random salt.
   */
  static generateSalt() {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * XOR encodes a string with a salt.
   * @param {string} str - The string to encode.
   * @param {string} salt - The salt to use.
   * @returns {string} The encoded string.
   */
  static xorEncode(str, salt) {
    const encodedStr = [];
    for (let i = 0; i < str.length; i++) {
      encodedStr.push(String.fromCharCode(str.charCodeAt(i) ^ salt.charCodeAt(i % salt.length)));
    }
    return encodedStr.join('');
  }

  /**
   * XOR decodes a string with a salt.
   * @param {string} str - The string to decode.
   * @param {string} salt - The salt to use.
   * @returns {string} The decoded string.
   */
  static xorDecode(str, salt) {
    return SecurityUtils.xorEncode(str, salt);
  }
}

module.exports = SecurityUtils;