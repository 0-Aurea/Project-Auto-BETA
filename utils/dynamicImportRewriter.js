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
   * Regular expression to match eval() calls.
   */
  static EVAL_REGEX = /eval\(['"](.*?)['"]\)/g;

  /**
   * Regular expression to match Function() calls.
   */
  static FUNCTION_CONSTRUCTOR_REGEX = /new\s+Function\(['"](.*?)['"]\)/g;

  /**
   * Regular expression to match Web Worker imports.
   */
  static WEB_WORKER_IMPORT_REGEX = /new\s+Worker\(['"](.*?)['"]\)/g;

  /**
   * Regular expression to match dynamic import() calls with complex URL scenarios.
   */
  static COMPLEX_IMPORT_REGEX = /import\(\)\.then\(.*?\)|import\(.*?\)|eval\(.*?\)|new\s+Function\(.*?\)|new\s+Worker\(.*?\)/g;

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
          const rewrittenCallback = callback.replace(DynamicImportRewriterUtils.IMPORT_REGEX, (importMatch, importUrl) => {
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
   * Rewriter function for eval() calls.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewriteEvalCalls(code, rewriter) {
    return code.replace(DynamicImportRewriterUtils.EVAL_REGEX, (match, evalCode) => {
      const rewrittenEvalCode = rewriter(evalCode);
      return `eval('${rewrittenEvalCode}')`;
    });
  }

  /**
   * Rewriter function for Function() calls.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewriteFunctionConstructorCalls(code, rewriter) {
    return code.replace(DynamicImportRewriterUtils.FUNCTION_CONSTRUCTOR_REGEX, (match, funcCode) => {
      const rewrittenFuncCode = rewriter(funcCode);
      return `new Function('${rewrittenFuncCode}')`;
    });
  }

  /**
   * Rewriter function for Web Worker imports.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewriteWebWorkerImports(code, rewriter) {
    return code.replace(DynamicImportRewriterUtils.WEB_WORKER_IMPORT_REGEX, (match, workerUrl) => {
      const rewrittenWorkerUrl = rewriter(workerUrl);
      return `new Worker('${rewrittenWorkerUrl}')`;
    });
  }

  /**
   * Rewriter function for dynamic import() calls, eval(), Function() calls, and Web Worker imports.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewriteComplexImports(code, rewriter) {
    return code.replace(DynamicImportRewriterUtils.COMPLEX_IMPORT_REGEX, (match) => {
      if (match.startsWith('import(')) {
        return DynamicImportRewriterUtils.rewriteDynamicImports(match, rewriter);
      } else if (match.startsWith('import().then(')) {
        return DynamicImportRewriterUtils.rewriteVariableImports(match, rewriter);
      } else if (match.startsWith('eval(')) {
        return DynamicImportRewriterUtils.rewriteEvalCalls(match, rewriter);
      } else if (match.startsWith('new Function(')) {
        return DynamicImportRewriterUtils.rewriteFunctionConstructorCalls(match, rewriter);
      } else if (match.startsWith('new Worker(')) {
        return DynamicImportRewriterUtils.rewriteWebWorkerImports(match, rewriter);
      }
      return match;
    });
  }

  /**
   * Rewriter function for dynamic import() calls, eval(), and Function() calls.
   * @param {string} code - The code string to rewrite.
   * @param {function} rewriter - The rewriter function.
   * @returns {string} The rewritten code.
   */
  static rewrite(code, rewriter) {
    code = DynamicImportRewriterUtils.rewriteComplexImports(code, rewriter);
    return code;
  }
}

export { DynamicImportRewriterUtils };