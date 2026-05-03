const { URL } = require('url');

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
   * Regular expression to match WebRTC getUserMedia and navigator.mediaDevices calls.
   */
  static WEBRTC_GET_USER_MEDIA_REGEX = /(getUserMedia|navigator\.mediaDevices\.getUserMedia)\s*\(\s*.*?\s*\)/g;

  /**
   * Encoding character set for URL encoding.
   */
  static ENCODING_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

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

    jsString = jsString.replace(JSRewriterUtils.WEBRTC_GET_USER_MEDIA_REGEX, () => {
      return 'null';
    });

    return jsString;
  }

  /**
   * Encodes a URL string using a simple XOR cipher with base64 encoding.
   * @param {string} str - The string to encode.
   * @param {string} origin - The origin URL.
   * @returns {string} The encoded string.
   */
  static encode(str, origin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const encodedData = new Uint8Array(data.length);

    for (let i = 0; i < data.length; i++) {
      encodedData[i] = data[i] ^ JSRewriterUtils.getSalt(origin)[i % JSRewriterUtils.getSalt(origin).length];
    }

    const encodedStr = btoa(String.fromCharCode(...encodedData));
    return encodedStr.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  /**
   * Decodes a URL string using a simple XOR cipher with base64 decoding.
   * @param {string} str - The string to decode.
   * @param {string} origin - The origin URL.
   * @returns {string} The decoded string.
   */
  static decode(str, origin) {
    const decoder = new TextDecoder();
    const encodedStr = str.replace(/-/g, '+').replace(/_/g, '/').padEnd((str.length + 3) & ~3, '=');
    const encodedData = new Uint8Array(atob(encodedStr).length);

    for (let i = 0; i < encodedData.length; i++) {
      encodedData[i] = encodedStr.charCodeAt(i);
    }

    const decodedData = new Uint8Array(encodedData.length);

    for (let i = 0; i < encodedData.length; i++) {
      decodedData[i] = encodedData[i] ^ JSRewriterUtils.getSalt(origin)[i % JSRewriterUtils.getSalt(origin).length];
    }

    return decoder.decode(decodedData);
  }

  /**
   * Generates a salt value based on the origin URL.
   * @param {string} origin - The origin URL.
   * @returns {Uint8Array} The salt value.
   */
  static getSalt(origin) {
    const encoder = new TextEncoder();
    return encoder.encode(origin);
  }
}

module.exports = JSRewriterUtils;