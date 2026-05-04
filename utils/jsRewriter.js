const { URL } = require('url');

/**
 * JS rewriter utility class for handling eval(), Function(), dynamic import(),
 * new Worker(), importScripts(), document.domain mutations, window.location,
 * window.open, and history.pushState/replaceState.
 */
class JsRewriterUtils {
  /**
   * Regular expression to match JS eval() calls.
   */
  static EVAL_REGEX = /(?:eval|Function)\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match JS dynamic import() calls.
   */
  static IMPORT_REGEX = /import\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match JS new Worker() calls.
   */
  static WORKER_REGEX = /new\s+Worker\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match JS importScripts() calls.
   */
  static IMPORT_SCRIPTS_REGEX = /importScripts\s*\(\s*['"](.*?)['"]\s*\)/g;

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
   * Regular expression to match history.pushState/replaceState calls.
   */
  static HISTORY_PUSH_STATE_REGEX = /(?:history\.pushState|history\.replaceState)\s*\(\s*.*?\s*,\s*.*?\s*,\s*['"](.*?)['"]\s*\)/g;

  /**
   * Rewriter function for JS eval() calls.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteEval(js, rewriter) {
    return js.replace(JsRewriterUtils.EVAL_REGEX, (match, p1) => {
      const rewrittenUrl = rewriter(p1);
      return `eval(${JSON.stringify(rewrittenUrl)})`;
    });
  }

  /**
   * Rewriter function for JS dynamic import() calls.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteImport(js, rewriter) {
    return js.replace(JsRewriterUtils.IMPORT_REGEX, (match, p1) => {
      const rewrittenUrl = rewriter(p1);
      return `import(${JSON.stringify(rewrittenUrl)})`;
    });
  }

  /**
   * Rewriter function for JS new Worker() calls.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteWorker(js, rewriter) {
    return js.replace(JsRewriterUtils.WORKER_REGEX, (match, p1) => {
      const rewrittenUrl = rewriter(p1);
      return `new Worker(${JSON.stringify(rewrittenUrl)})`;
    });
  }

  /**
   * Rewriter function for JS importScripts() calls.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteImportScripts(js, rewriter) {
    return js.replace(JsRewriterUtils.IMPORT_SCRIPTS_REGEX, (match, p1) => {
      const rewrittenUrl = rewriter(p1);
      return `importScripts(${JSON.stringify(rewrittenUrl)})`;
    });
  }

  /**
   * Rewriter function for document.domain mutations.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteDocumentDomain(js, rewriter) {
    return js.replace(JsRewriterUtils.DOCUMENT_DOMAIN_REGEX, (match, p1) => {
      const rewrittenDomain = rewriter(p1);
      return `document.domain = ${JSON.stringify(rewrittenDomain)}`;
    });
  }

  /**
   * Rewriter function for window.location assignments.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteWindowLocation(js, rewriter) {
    return js.replace(JsRewriterUtils.WINDOW_LOCATION_REGEX, (match, p1) => {
      const rewrittenUrl = rewriter(p1);
      return `window.location = ${JSON.stringify(rewrittenUrl)}`;
    });
  }

  /**
   * Rewriter function for window.open calls.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteWindowOpen(js, rewriter) {
    return js.replace(JsRewriterUtils.WINDOW_OPEN_REGEX, (match, p1) => {
      const rewrittenUrl = rewriter(p1);
      return `window.open(${JSON.stringify(rewrittenUrl)})`;
    });
  }

  /**
   * Rewriter function for history.pushState/replaceState calls.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteHistoryPushState(js, rewriter) {
    return js.replace(JsRewriterUtils.HISTORY_PUSH_STATE_REGEX, (match, p1) => {
      const rewrittenUrl = rewriter(p1);
      return `history.pushState(${JSON.stringify(rewrittenUrl)})`;
    });
  }

  /**
   * Rewrite JS string to handle complex cases.
   * @param {string} js - The JS string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten JS string.
   */
  static rewriteJs(js, rewriter) {
    js = JsRewriterUtils.rewriteEval(js, rewriter);
    js = JsRewriterUtils.rewriteImport(js, rewriter);
    js = JsRewriterUtils.rewriteWorker(js, rewriter);
    js = JsRewriterUtils.rewriteImportScripts(js, rewriter);
    js = JsRewriterUtils.rewriteDocumentDomain(js, rewriter);
    js = JsRewriterUtils.rewriteWindowLocation(js, rewriter);
    js = JsRewriterUtils.rewriteWindowOpen(js, rewriter);
    js = JsRewriterUtils.rewriteHistoryPushState(js, rewriter);
    return js;
  }
}

module.exports = JsRewriterUtils;