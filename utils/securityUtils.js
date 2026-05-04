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

    return html;
  }

  /**
   * Manages Content Security Policy (CSP) headers.
   */
  static class CSPUtils {
    /**
     * Default CSP policy.
     */
    static defaultPolicy = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'object-src': ["'none'"],
      'frame-src': ["'none'"],
      'child-src': ["'none'"],
    };

    /**
     * Merges two CSP policies.
     * @param {object} policy1 - The first CSP policy.
     * @param {object} policy2 - The second CSP policy.
     * @returns {object} The merged CSP policy.
     */
    static mergePolicies(policy1, policy2) {
      const mergedPolicy = { ...policy1 };
      for (const directive in policy2) {
        if (!mergedPolicy[directive]) {
          mergedPolicy[directive] = policy2[directive];
        } else {
          mergedPolicy[directive] = [...new Set([...mergedPolicy[directive], ...policy2[directive]])];
        }
      }
      return mergedPolicy;
    }

    /**
     * Converts a CSP policy to a header string.
     * @param {object} policy - The CSP policy.
     * @returns {string} The CSP header string.
     */
    static policyToHeader(policy) {
      const header = [];
      for (const directive in policy) {
        header.push(`${directive} ${policy[directive].join(' ')}`);
      }
      return header.join('; ');
    }
  }

  /**
   * Validates and rewrites URLs to prevent SSRF attacks.
   * @param {string} url - The URL to validate and rewrite.
   * @param {string} baseUrl - The base URL of the proxied resource.
   * @returns {string} The validated and rewritten URL.
   */
  static validateAndRewriteUrl(url, baseUrl) {
    const { URL } = require('url');
    const parsedUrl = new URL(url, baseUrl);
    if (!parsedUrl.protocol || !parsedUrl.host) {
      throw new Error('Invalid URL');
    }
    return parsedUrl.href;
  }
}

module.exports = SecurityUtils;