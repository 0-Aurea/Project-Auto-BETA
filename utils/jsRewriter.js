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
      if (funcName === 'window.location') {
        return `window.location = ${JSRewriterUtils.encode(arg, origin)}`;
      } else {
        return `window.open(${JSRewriterUtils.encode(arg, origin)})`;
      }
    });

    jsString = jsString.replace(JSRewriterUtils.HISTORY_PUSH_STATE_REGEX, (match, funcName) => {
      return `${funcName}(..., ${JSRewriterUtils.encode(origin)})`;
    });

    jsString = jsString.replace(JSRewriterUtils.WEBRTC_GET_USER_MEDIA_REGEX, (match) => {
      return '/* WebRTC blocked */';
    });

    return jsString;
  }

  /**
   * Encodes a URL string using a XOR + base64 encoding scheme.
   * @param {string} urlString - The URL string to encode.
   * @param {string} origin - The origin URL.
   * @returns {string} The encoded URL string.
   */
  static encode(urlString, origin) {
    const encoder = new TextEncoder();
    const urlBytes = encoder.encode(urlString);
    const originBytes = encoder.encode(origin);

    // Perform XOR with origin bytes
    const xorBytes = new Uint8Array(urlBytes.length);
    for (let i = 0; i < urlBytes.length; i++) {
      xorBytes[i] = urlBytes[i] ^ originBytes[i % originBytes.length];
    }

    // Base64 encode
    const encodedString = btoa(String.fromCharCode(...xorBytes));

    return encodedString.replace(/=/g, '');
  }

  /**
   * Decodes a URL string using a XOR + base64 decoding scheme.
   * @param {string} encodedString - The encoded URL string.
   * @param {string} origin - The origin URL.
   * @returns {string} The decoded URL string.
   */
  static decode(encodedString, origin) {
    const decoder = new TextDecoder();
    const xorBytes = new Uint8Array(atob(encodedString).length);
    for (let i = 0; i < xorBytes.length; i++) {
      xorBytes[i] = atob(encodedString)[i].charCodeAt(0);
    }

    const originBytes = new TextEncoder().encode(origin);

    // Perform XOR with origin bytes
    const urlBytes = new Uint8Array(xorBytes.length);
    for (let i = 0; i < xorBytes.length; i++) {
      urlBytes[i] = xorBytes[i] ^ originBytes[i % originBytes.length];
    }

    return decoder.decode(urlBytes);
  }
}

module.exports = JSRewriterUtils;