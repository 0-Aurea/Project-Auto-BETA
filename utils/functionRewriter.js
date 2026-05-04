class FunctionRewriter {
  /**
   * Regular expression to match Function constructor calls.
   */
  static FUNCTION_CONSTRUCTOR_REGEX = /\bFunction\b\(/g;

  /**
   * Regular expression to match dynamic import statements.
   */
  static DYNAMIC_IMPORT_REGEX = /\bimport\(/g;

  /**
   * Regular expression to match eval() calls.
   */
  static EVAL_REGEX = /\beval\(/g;

  /**
   * Rewrites a JavaScript function to execute in the context of the proxy.
   * @param {string} jsCode - The JavaScript code to rewrite.
   * @param {string} origin - The origin of the proxied request.
   * @returns {string} The rewritten JavaScript code.
   */
  static rewriteFunction(jsCode, origin) {
    // Handle Function constructor calls
    jsCode = jsCode.replace(FunctionRewriter.FUNCTION_CONSTRUCTOR_REGEX, (match) => {
      return `FunctionRewriter.proxyFunction(${match}`;
    });

    // Handle dynamic import statements
    jsCode = jsCode.replace(FunctionRewriter.DYNAMIC_IMPORT_REGEX, (match) => {
      return `FunctionRewriter.proxyImport(${match}`;
    });

    // Handle eval() calls
    jsCode = jsCode.replace(FunctionRewriter.EVAL_REGEX, (match) => {
      return `FunctionRewriter.proxyEval(${match}`;
    });

    // Wrap the code in a proxy function to handle dynamic code execution
    jsCode = `FunctionRewriter.proxyFunctionWrapper(${jsCode}, '${origin}')`;

    return jsCode;
  }

  /**
   * Proxy function wrapper to handle dynamic code execution.
   * @param {string} jsCode - The JavaScript code to execute.
   * @param {string} origin - The origin of the proxied request.
   * @returns {any} The result of the executed code.
   */
  static proxyFunctionWrapper(jsCode, origin) {
    try {
      // Create a new function to execute the code in the context of the proxy
      const func = new Function(`return ${jsCode}`);
      const result = func();

      // Handle the result of the executed code
      if (result instanceof Promise) {
        return result.catch((error) => {
          throw new Error(`Error executing proxied code: ${error.message}`);
        });
      }

      return result;
    } catch (error) {
      throw new Error(`Error executing proxied code: ${error.message}`);
    }
  }

  /**
   * Proxy function to handle Function constructor calls.
   * @param {string} args - The arguments to the Function constructor.
   * @returns {Function} The proxied function.
   */
  static proxyFunction(args) {
    try {
      // Create a new function to execute the code in the context of the proxy
      const func = new Function(args);
      return func;
    } catch (error) {
      throw new Error(`Error creating proxied function: ${error.message}`);
    }
  }

  /**
   * Proxy import to handle dynamic import statements.
   * @param {string} args - The arguments to the import statement.
   * @returns {Promise<any>} The proxied import.
   */
  static proxyImport(args) {
    try {
      // Create a new import to execute the code in the context of the proxy
      return import(args);
    } catch (error) {
      throw new Error(`Error creating proxied import: ${error.message}`);
    }
  }

  /**
   * Proxy eval to handle eval() calls.
   * @param {string} args - The arguments to the eval() call.
   * @returns {any} The result of the evaluated code.
   */
  static proxyEval(args) {
    try {
      // Create a new eval to execute the code in the context of the proxy
      return eval(args);
    } catch (error) {
      throw new Error(`Error evaluating proxied code: ${error.message}`);
    }
  }
}

export default FunctionRewriter;