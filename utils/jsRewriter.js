const { URL } = require('url');
const { JSDOM } = require('jsdom');

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
    const rewrittenUrl = `${dom.protocol}//${dom.host}${dom.pathname}`;

    // Apply URL rewriting rules here
    return rewrittenUrl;
  }
}

module.exports = JSRewriterUtils;