/**
 * Security utility class for general security-related functions and checks.
 */
class SecurityUtils {
  /**
   * Regular expression to match common web vulnerabilities in user input.
   */
  static VULNERABILITY_REGEX = /<(?:script|img|iframe|object|embed|applet|form|input|textarea|select|option|optgroup|button|style|link|meta|frame|frameset|noframes|noframe|iframe|frame|script|style|svg|math|plaintext|marquee|blink|spacer|a|abbr|acronym|address|applet|area|b|base|basefont|bdi|bdo|big|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|dd|del|dfn|dir|div|dl|dt|em|fieldset|figcaption|figure|font|footer|form|frameset|h1|h2|h3|h4|h5|h6|head|header|hgroup|hr|html|i|iframe|ins|kbd|keygen|label|legend|li|link|main|map|mark|menu|menuitem|meta|meter|nav|noframes|noscript|object|ol|optgroup|option|output|p|param|picture|plaintext|portal|pre|progress|q|rb|rp|rt|rtc|ruby|s|samp|script|section|select|slot|small|source|span|strike|strong|style|sub|summary|sup|svg|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)[\s\S]*?(?:\/>|>)/gi;

  /**
   * Check if a string contains potential web vulnerabilities.
   * @param {string} input - The input string to check.
   * @returns {boolean} True if the string contains potential web vulnerabilities, false otherwise.
   */
  static containsVulnerabilities(input) {
    return SecurityUtils.VULNERABILITY_REGEX.test(input);
  }

  /**
   * Sanitize a string to prevent web vulnerabilities.
   * @param {string} input - The input string to sanitize.
   * @returns {string} The sanitized string.
   */
  static sanitizeString(input) {
    return input.replace(SecurityUtils.VULNERABILITY_REGEX, '');
  }

  /**
   * Validate a URL to prevent SSRF and DNS rebinding attacks.
   * @param {string} url - The URL to validate.
   * @returns {boolean} True if the URL is valid, false otherwise.
   */
  static validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol && parsedUrl.host;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a URL is a valid HTTPS URL.
   * @param {string} url - The URL to check.
   * @returns {boolean} True if the URL is a valid HTTPS URL, false otherwise.
   */
  static isValidHttpsUrl(url) {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:' && parsedUrl.host;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a random cryptographically secure token.
   * @param {number} length - The length of the token.
   * @returns {string} The generated token.
   */
  static generateToken(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Hash a string using SHA-256.
   * @param {string} input - The input string to hash.
   * @returns {string} The hashed string.
   */
  static hashString(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    return crypto.subtle.digest('SHA-256', data).then((hash) => {
      return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
    });
  }
}

export default SecurityUtils;