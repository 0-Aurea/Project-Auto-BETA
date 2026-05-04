const { URL } = require('url');
const { JSDOM } = require('jsdom');
const { EncodingUtils } = require('./encoding');
const { UrlUtils } = require('./urlUtils');
const { SourceMapUtils } = require('./sourceMapUtils');

/**
 * JavaScript rewriter utility class for handling complex JavaScript rewriting,
 * including eval(), Function(), dynamic import(), WebWorker creation, and source map URL stripping.
 */
class JSRewriterUtils {
  /**
   * Regular expression to match JavaScript URLs.
   */
  static JS_URL_REGEX = /(?:https?:\/\/|\/)[^'"]+\.js(?:\?.*)?/g;

  /**
   * Regular expression to match eval() and Function() calls.
   */
  static EVAL_FUNCTION_REGEX = /(?:eval|Function)\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match dynamic import() calls.
   */
  static DYNAMIC_IMPORT_REGEX = /import\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match WebWorker creation.
   */
  static WEB_WORKER_REGEX = /new\s+Worker\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match WebSocket creation.
   */
  static WEB_SOCKET_REGEX = /new\s+WebSocket\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match source map URLs.
   */
  static SOURCE_MAP_REGEX = /#sourceMappingURL=(.*?)(\s|$)/g;

  /**
   * Regular expression to match document.domain mutations.
   */
  static DOCUMENT_DOMAIN_REGEX = /document\.domain\s*=\s*['"](.*?)['"]/g;

  /**
   * Regular expression to match window.location assignments.
   */
  static WINDOW_LOCATION_REGEX = /window\.location\s*=\s*['"](.*?)['"]/g;

  /**
   * Regular expression to match window.open calls.
   */
  static WINDOW_OPEN_REGEX = /window\.open\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match history.pushState and history.replaceState calls.
   */
  static HISTORY_PUSH_STATE_REGEX = /(history\.(pushState|replaceState))\s*\(\s*[^,]+,\s*['"](.*?)['"]/g;

  /**
   * Rewrites a JavaScript string by handling eval(), Function(), dynamic import(),
   * WebWorker creation, WebSocket creation, and source map URL stripping.
   * @param {string} jsString - The JavaScript string to rewrite.
   * @param {string} baseUrl - The base URL of the JavaScript file.
   * @returns {string} The rewritten JavaScript string.
   */
  static rewriteJs(jsString, baseUrl) {
    // Handle eval() and Function() calls
    jsString = jsString.replace(JSRewriterUtils.EVAL_FUNCTION_REGEX, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `eval(${JSON.stringify(rewrittenUrl)})`;
    });

    // Handle dynamic import() calls
    jsString = jsString.replace(JSRewriterUtils.DYNAMIC_IMPORT_REGEX, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `import(${JSON.stringify(rewrittenUrl)})`;
    });

    // Handle WebWorker creation
    jsString = jsString.replace(JSRewriterUtils.WEB_WORKER_REGEX, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `new Worker(${JSON.stringify(rewrittenUrl)})`;
    });

    // Handle WebSocket creation
    jsString = jsString.replace(JSRewriterUtils.WEB_SOCKET_REGEX, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `new WebSocket(${JSON.stringify(rewrittenUrl)})`;
    });

    // Handle source map URL stripping
    jsString = jsString.replace(JSRewriterUtils.SOURCE_MAP_REGEX, (match, p1) => {
      return '';
    });

    // Handle document.domain mutations
    jsString = jsString.replace(JSRewriterUtils.DOCUMENT_DOMAIN_REGEX, (match, p1) => {
      return `document.domain = ${JSON.stringify(UrlUtils.getHostname(baseUrl))}`;
    });

    // Handle window.location assignments
    jsString = jsString.replace(JSRewriterUtils.WINDOW_LOCATION_REGEX, (match, p1) => {
      return `window.location = ${JSON.stringify(UrlUtils.getUrl(baseUrl, p1))}`;
    });

    // Handle window.open calls
    jsString = jsString.replace(JSRewriterUtils.WINDOW_OPEN_REGEX, (match, p1) => {
      return `window.open(${JSON.stringify(UrlUtils.getUrl(baseUrl, p1))})`;
    });

    // Handle history.pushState and history.replaceState calls
    jsString = jsString.replace(JSRewriterUtils.HISTORY_PUSH_STATE_REGEX, (match, p1, p2, p3) => {
      return `${p1}(${p2}, ${JSON.stringify(p3)})`;
    });

    return jsString;
  }

  /**
   * Rewrites a URL to ensure it is proxied through the Nexus proxy.
   * @param {string} url - The URL to rewrite.
   * @param {string} baseUrl - The base URL of the JavaScript file.
   * @returns {string} The rewritten URL.
   */
  static rewriteUrl(url, baseUrl) {
    const urlObject = new URL(url, baseUrl);
    const rewrittenUrl = UrlUtils.getUrl(baseUrl, urlObject.href);
    return rewrittenUrl;
  }

  /**
   * Strips sourceMappingURL comments from a JavaScript string.
   * @param {string} jsString - The JavaScript string to strip.
   * @returns {string} The stripped JavaScript string.
   */
  static stripSourceMappingURL(jsString) {
    return jsString.replace(JSRewriterUtils.SOURCE_MAP_REGEX, '');
  }

  /**
   * Rewrites inline event handlers to ensure they are proxied through the Nexus proxy.
   * @param {string} jsString - The JavaScript string to rewrite.
   * @param {string} baseUrl - The base URL of the JavaScript file.
   * @returns {string} The rewritten JavaScript string.
   */
  static rewriteInlineEventHandlers(jsString, baseUrl) {
    const dom = new JSDOM(jsString);
    const elements = dom.window.document.querySelectorAll('[on*=""]');
    elements.forEach((element) => {
      const attributeName = Array.from(element.attributes).find((attribute) => attribute.name.startsWith('on'));
      if (attributeName) {
        const attributeValue = element.getAttribute(attributeName.name);
        const rewrittenAttributeValue = JSRewriterUtils.rewriteUrl(attributeValue, baseUrl);
        element.setAttribute(attributeName.name, rewrittenAttributeValue);
      }
    });
    return dom.serialize();
  }
}

module.exports = JSRewriterUtils;