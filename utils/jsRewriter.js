const { JSDOM } = require('jsdom');

/**
 * JS rewriter utility class for handling eval(), Function(), dynamic import(), new Worker(), importScripts(),
 * document.domain mutations, window.location, window.open, and history.pushState/replaceState.
 */
class JSRewriterUtils {
  /**
   * Regular expression to match JS eval() and Function() calls.
   */
  static EVAL_FUNCTION_REGEX = /(eval|Function)\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match JS dynamic import() calls.
   */
  static DYNAMIC_IMPORT_REGEX = /import\s*\(\s*['"](.*?)['"]\s*\)/g;

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
   * Regular expression to match window.location and window.open calls.
   */
  static WINDOW_LOCATION_OPEN_REGEX = /(window\.location|window\.open)\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match history.pushState and history.replaceState calls.
   */
  static HISTORY_PUSH_STATE_REGEX = /(history\.pushState|history\.replaceState)\s*\(\s*.*?\s*\)/g;

  /**
   * Rewrites a JS string by handling eval(), Function(), dynamic import(), new Worker(), importScripts(),
   * document.domain mutations, window.location, window.open, and history.pushState/replaceState.
   * @param {string} jsString - The JS string to rewrite.
   * @param {string} origin - The origin URL.
   * @returns {string} The rewritten JS string.
   */
  static rewrite(jsString, origin) {
    jsString = jsString.replace(JSRewriterUtils.EVAL_FUNCTION_REGEX, (match, funcName, arg) => {
      return `${funcName}(${JSRewriterUtils.encode(arg, origin)})`;
    });

    jsString = jsString.replace(JSRewriterUtils.DYNAMIC_IMPORT_REGEX, (match, arg) => {
      return `import(${JSRewriterUtils.encode(arg, origin)})`;
    });

    jsString = jsString.replace(JSRewriterUtils.WORKER_REGEX, (match, arg) => {
      return `new Worker(${JSRewriterUtils.encode(arg, origin)})`;
    });

    jsString = jsString.replace(JSRewriterUtils.IMPORT_SCRIPTS_REGEX, (match, arg) => {
      return `importScripts(${JSRewriterUtils.encode(arg, origin)})`;
    });

    jsString = jsString.replace(JSRewriterUtils.DOCUMENT_DOMAIN_REGEX, (match, arg) => {
      return `document.domain = ${JSRewriterUtils.encode(arg, origin)}`;
    });

    jsString = jsString.replace(JSRewriterUtils.WINDOW_LOCATION_OPEN_REGEX, (match, funcName, arg) => {
      return `${funcName}(${JSRewriterUtils.encode(arg, origin)})`;
    });

    jsString = jsString.replace(JSRewriterUtils.HISTORY_PUSH_STATE_REGEX, (match, funcName) => {
      return `${funcName}(...arguments)`;
    });

    return jsString;
  }

  /**
   * Encodes a URL string using the XOR + base64 URL encoding scheme with a rotating salt.
   * @param {string} urlString - The URL string to encode.
   * @param {string} origin - The origin URL.
   * @returns {string} The encoded URL string.
   */
  static encode(urlString, origin) {
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(urlString);
    const saltBytes = encoder.encode(origin);
    const encodedBytes = new Uint8Array(urlBytes.length);

    for (let i = 0; i < urlBytes.length; i++) {
      encodedBytes[i] = urlBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    const encodedString = btoa(String.fromCharCode(...encodedBytes));
    return encodedString.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  /**
   * Decodes a URL string using the XOR + base64 URL decoding scheme with a rotating salt.
   * @param {string} encodedString - The encoded URL string.
   * @param {string} origin - The origin URL.
   * @returns {string} The decoded URL string.
   */
  static decode(encodedString, origin) {
    const decoder = new TextDecoder();
    const saltBytes = new TextEncoder().encode(origin);
    const encodedBytes = new Uint8Array(atob(encodedString.replace('-', '+').replace('_', '/')).length);

    for (let i = 0; i < encodedBytes.length; i++) {
      encodedBytes[i] = encodedString.charCodeAt(i);
    }

    const decodedBytes = new Uint8Array(encodedBytes.length);

    for (let i = 0; i < encodedBytes.length; i++) {
      decodedBytes[i] = encodedBytes[i] ^ saltBytes[i % saltBytes.length];
    }

    return decoder.decode(decodedBytes);
  }
}

module.exports = JSRewriterUtils;