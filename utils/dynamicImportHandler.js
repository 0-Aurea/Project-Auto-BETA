class DynamicImportHandler {
  /**
   * Regular expression to match dynamic import statements.
   */
  static DYNAMIC_IMPORT_REGEX = /(?:import|require)\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Regular expression to match function constructor calls with dynamic import statements.
   */
  static FUNCTION_CONSTRUCTOR_IMPORT_REGEX = /new\s+Function\s*\(\s*['"](.*?)['"]\s*\)/g;

  /**
   * Rewrites dynamic import statements to use the proxied URL.
   * @param {string} code - The code to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten code.
   */
  static rewriteDynamicImports(code, proxiedUrl) {
    return code.replace(DynamicImportHandler.DYNAMIC_IMPORT_REGEX, (match, importUrl) => {
      return `import('${proxiedUrl}/${importUrl}')`;
    });
  }

  /**
   * Rewrites function constructor calls with dynamic import statements to use the proxied URL.
   * @param {string} code - The code to rewrite.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The rewritten code.
   */
  static rewriteFunctionConstructorImports(code, proxiedUrl) {
    return code.replace(DynamicImportHandler.FUNCTION_CONSTRUCTOR_IMPORT_REGEX, (match, importUrl) => {
      return `new Function('${proxiedUrl}/${importUrl}')`;
    });
  }

  /**
   * Handles dynamic import statements by rewriting them to use the proxied URL.
   * @param {string} code - The code to handle.
   * @param {string} proxiedUrl - The proxied URL.
   * @returns {string} The handled code.
   */
  static handleDynamicImports(code, proxiedUrl) {
    code = DynamicImportHandler.rewriteDynamicImports(code, proxiedUrl);
    code = DynamicImportHandler.rewriteFunctionConstructorImports(code, proxiedUrl);
    return code;
  }

  /**
   * Evaluates a dynamic import statement and returns the result.
   * @param {string} importUrl - The URL of the import.
   * @returns {Promise<any>} The result of the import.
   */
  static async evaluateDynamicImport(importUrl) {
    try {
      const result = await globalThis.import(importUrl);
      return result;
    } catch (error) {
      globalThis.console.error(`Error evaluating dynamic import: ${error}`);
      throw error;
    }
  }
}