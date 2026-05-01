/**
 * @fileoverview A simple Dependency Injection container for managing and resolving application dependencies.
 * This injector supports registering values, class constructors, and factory functions,
 * with options for singleton instances.
 */

/**
 * A simple Dependency Injection (DI) container.
 * It allows you to register dependencies (services, configurations, etc.)
 * and resolve them when needed. It supports singletons (instantiated once)
 * and factories (new instance on each resolve or a function that creates it).
 */
class Injector {
    constructor() {
        /**
         * Stores registered dependency definitions.
         * Key: dependency name (string)
         * Value: { dependency: any, singleton: boolean, factory: boolean }
         *   - `dependency`: The actual value, class constructor, or factory function.
         *   - `singleton`: If true, only one instance will be created and reused.
         *   - `factory`: If true, `dependency` is a function (or class) that needs to be called to get an instance.
         * @private
         * @type {Map<string, {dependency: any, singleton: boolean, factory: boolean}>}
         */
        this.dependencies = new Map();

        /**
         * Stores singleton instances once they are created.
         * This map is only used for dependencies registered with `singleton: true`.
         * Key: dependency name (string)
         * Value: The instantiated singleton object.
         * @private
         * @type {Map<string, any>}
         */
        this.singletons = new Map();
    }

    /**
     * Registers a dependency with the injector.
     *
     * @param {string} name - The unique name (identifier) of the dependency.
     * @param {any} dependency - The dependency itself. This can be:
     *   - A plain value (string, number, object, array).
     *   - A class constructor (e.g., `MyServiceClass`).
     *   - A factory function (e.g., `(injector) => new MyService(injector.resolve('MyRepository'))`).
     * @param {object} [options={}] - Configuration options for the dependency.
     * @param {boolean} [options.singleton=false] - If true, the dependency will be instantiated only once
     *                                            and the same instance will be returned on subsequent `resolve` calls.
     * @param {boolean} [options.factory=false] - If true, the `dependency` argument is treated as a function
     *                                            (or class constructor) that will be called to create the instance.
     *                                            If `dependency` is detected as a class constructor, `factory` is implicitly true.
     * @throws {Error} If the dependency name is invalid (not a non-empty string).
     */
    register(name, dependency, options = {}) {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new Error('Injector: Dependency name must be a non-empty string.');
        }
        if (this.dependencies.has(name)) {
            // Warn if a dependency is being re-registered. This can indicate a configuration error
            // or lead to unexpected behavior, especially with singletons.
            console.warn(`Injector: Dependency "${name}" is being re-registered. ` +
                         `Any existing singleton instance will be discarded.`);
        }

        // Detect if the dependency is a class constructor.
        // This heuristic checks if it's a function with a prototype and its constructor points to itself.
        const isClassConstructor = typeof dependency === 'function' &&
                                   dependency.prototype &&
                                   dependency.prototype.constructor === dependency;

        this.dependencies.set(name, {
            dependency,
            singleton: options.singleton === true, // Ensure boolean type
            factory: options.factory === true || isClassConstructor // Implicitly a factory if it's a class
        });

        // If a singleton was re-registered, invalidate its existing instance to ensure the new definition is used.
        if (this.singletons.has(name)) {
            this.singletons.delete(name);
        }
    }

    /**
     * Resolves and returns an instance of the specified dependency.
     *
     * - If the dependency is a singleton and already instantiated, the existing instance is returned.
     * - If it's a factory (or class), a new instance is created (unless it's a singleton and already exists).
     * - If it's a plain value, the value itself is returned.
     *
     * @param {string} name - The name of the dependency to resolve.
     * @returns {any} The resolved dependency instance or value.
     * @throws {Error} If the dependency with the given name is not registered.
     */
    resolve(name) {
        if (!this.dependencies.has(name)) {
            throw new Error(`Injector: Dependency "${name}" not registered.`);
        }

        const { dependency, singleton, factory } = this.dependencies.get(name);

        if (singleton) {
            // If it's a singleton, check if an instance already exists.
            if (this.singletons.has(name)) {
                return this.singletons.get(name);
            }

            // If not, create the instance, store it, and then return it.
            let instance;
            if (factory) {
                instance = this._instantiate(dependency);
            } else {
                instance = dependency; // Direct value for singleton
            }
            this.singletons.set(name, instance);
            return instance;
        } else {
            // Not a singleton. Always create a new instance if it's a factory.
            if (factory) {
                return this._instantiate(dependency);
            } else {
                return dependency; // Direct value, returned as is
            }
        }
    }

    /**
     * Checks if a dependency with the given name is registered in the injector.
     *
     * @param {string} name - The name of the dependency to check.
     * @returns {boolean} True if the dependency is registered, false otherwise.
     */
    has(name) {
        return this.dependencies.has(name);
    }

    /**
     * Clears all registered dependencies and their singleton instances from the injector.
     * This is particularly useful for testing environments or when resetting the application state.
     */
    clear() {
        this.dependencies.clear();
        this.singletons.clear();
    }

    /**
     * Internal helper method to instantiate a dependency if it's a class constructor or a factory function.
     *
     * @private
     * @param {function} dependency - The class constructor or factory function to instantiate.
     * @returns {any} The instantiated object.
     */
    _instantiate(dependency) {
        // If the dependency is a class constructor
        if (typeof dependency === 'function' && dependency.prototype && dependency.prototype.constructor === dependency) {
            // For simplicity, this injector assumes class constructors either take no arguments
            // or manage their own dependencies internally (e.g., by taking the injector as an argument
            // and calling `injector.resolve()` within their constructor).
            // More advanced DI containers might parse constructor arguments for injection.
            return new dependency();
        } else if (typeof dependency === 'function') {
            // If it's a factory function (not a class constructor), call it.
            // A common pattern is to pass the injector instance to the factory function,
            // allowing the factory to resolve its own sub-dependencies.
            return dependency(this);
        }
        // This case should ideally not be reached if `factory` flag is set correctly
        // and `_instantiate` is only called when `dependency` is indeed a function.
        return dependency; // Fallback, though conceptually incorrect if `factory` is true here.
    }
}

/**
 * A default, globally available instance of the Injector.
 * This is useful for many applications where a single, central container is sufficient.
 * It can be imported and used directly without needing to create a new `Injector` instance.
 * @type {Injector}
 */
const defaultInjector = new Injector();

export {
    Injector,
    defaultInjector
};