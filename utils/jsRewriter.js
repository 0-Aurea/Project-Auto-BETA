const { URL } = require('url');
const { JSDOM } = require('jsdom');
const { EncodingUtils } = require('./encoding');
const { UrlUtils } = require('./urlUtils');

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
   * Regular expression to match source map URLs.
   */
  static SOURCE_MAP_REGEX = /#sourceMappingURL=(.*?)(\s|$)/g;

  /**
   * Rewrites a JavaScript string by handling eval(), Function(), dynamic import(),
   * WebWorker creation, and source map URL stripping.
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

    // Handle source map URL stripping
    jsString = jsString.replace(JSRewriterUtils.SOURCE_MAP_REGEX, () => '');

    // Handle document.domain mutations
    jsString = jsString.replace(/document\.domain\s*=\s*['"](.*?)['"]/g, (match, p1) => {
      return `document.domain = ${JSON.stringify(p1)}`;
    });

    // Handle window.location and window.open
    jsString = jsString.replace(/window\.location\s*=\s*['"](.*?)['"]/g, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `window.location = ${JSON.stringify(rewrittenUrl)}`;
    });
    jsString = jsString.replace(/window\.open\s*\(\s*['"](.*?)['"]/g, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `window.open(${JSON.stringify(rewrittenUrl)})`;
    });

    // Handle history.pushState and history.replaceState
    jsString = jsString.replace(/history\.pushState\s*\(\s*.*?\s*,\s*['"](.*?)['"]/g, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `history.pushState(${JSON.stringify(rewrittenUrl)})`;
    });
    jsString = jsString.replace(/history\.replaceState\s*\(\s*.*?\s*,\s*['"](.*?)['"]/g, (match, p1) => {
      const rewrittenUrl = JSRewriterUtils.rewriteUrl(p1, baseUrl);
      return `history.replaceState(${JSON.stringify(rewrittenUrl)})`;
    });

    return jsString;
  }

  /**
   * Rewrites a URL by applying the proxy's URL rewriting rules.
   * @param {string} url - The URL to rewrite.
   * @param {string} baseUrl - The base URL of the JavaScript file.
   * @returns {string} The rewritten URL.
   */
  static rewriteUrl(url, baseUrl) {
    const dom = new URL(url, baseUrl);
    let rewrittenUrl = `${dom.protocol}//${dom.host}${dom.pathname}`;

    if (dom.search) {
      rewrittenUrl += dom.search;
    }

    if (dom.hash) {
      rewrittenUrl += dom.hash;
    }

    // Apply URL rewriting rules here
    const salt = EncodingUtils.getSalt();
    rewrittenUrl = UrlUtils.encodeUrl(rewrittenUrl, salt);

    return rewrittenUrl;
  }
}

module.exports = JSRewriterUtils;