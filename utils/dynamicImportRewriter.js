/**
 * Dynamic import rewriter utility class for handling dynamic import scenarios.
 */
class DynamicImportRewriterUtils {
  /**
   * Regular expression to match dynamic import() calls.
   */
  static IMPORT_REGEX = /import\(['"](.*?)['"]\)/g;

  /**
   * Regular expression to match dynamic import() calls with variables.
   */
  static VARIABLE_IMPORT_REGEX = /import\(\)\.then\(.*?\)/g;

  /**
   * Rewriter function for dynamic import() calls.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewriteDynamicImports(code, rewriter) {
    return code.replace(DynamicImportRewriterUtils.IMPORT_REGEX, (match, url) => {
      const rewrittenUrl = rewriter(url);
      return `import('${rewrittenUrl}')`;
    });
  }

  /**
   * Rewriter function for dynamic import() calls with variables.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewriteVariableImports(code, rewriter) {
    return code.replace(DynamicImportRewriterUtils.VARIABLE_IMPORT_REGEX, (match) => {
      return match.replace(/import\(\)\.then\(.*?\)/g, () => {
        const dynamicImport = match.match(/import\(\)\.then\((.*?)\)/);
        if (dynamicImport && dynamicImport[1]) {
          const callback = dynamicImport[1].trim();
          const rewrittenCallback = callback.replace(/import\(['"](.*?)['"]\)/g, (importMatch, importUrl) => {
            const rewrittenImportUrl = rewriter(importUrl);
            return `import('${rewrittenImportUrl}')`;
          });
          return `import().then(${rewrittenCallback})`;
        }
        return match;
      });
    });
  }

  /**
   * Rewriter function for dynamic import() calls, eval(), and Function() calls.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewrite(code, rewriter) {
    code = DynamicImportRewriterUtils.rewriteDynamicImports(code, rewriter);
    code = DynamicImportRewriterUtils.rewriteVariableImports(code, rewriter);
    return code;
  }
}

export { DynamicImportRewriterUtils };