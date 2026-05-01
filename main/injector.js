/**
 * @fileoverview A robust Dependency Injection container for managing and resolving application dependencies.
 * This injector supports registering values, class constructors, and factory functions,
 * with explicit options for singleton instances and dynamic dependency resolution.
 */

/**
 * A Dependency Injection (DI) container.
 * It facilitates the registration and resolution of dependencies (services, configurations, etc.),
 * supporting singletons (instantiated once) and factories (new instance on each resolve or a function that creates it).
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
         * This map is exclusively used for dependencies registered with `singleton: true`.
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
     * @param {string} name - The unique identifier for the dependency.
     * @param {any} dependency - The dependency itself. This can be a value, a class constructor, or a factory function.
     * @param {object} [options={}] - Configuration options for the dependency.
     * @param {boolean} [options.singleton=false] - If true, the dependency will be instantiated only once
     *                                            and the same instance returned on subsequent `resolve` calls.
     * @param {boolean} [options.factory=false] - If true, the `dependency` argument is treated as a function
     *                                            (or class constructor) that will be invoked to create the instance.
     *                                            If `dependency` is detected as an ES6 class constructor, `factory` is implicitly true.
     * @throws {Error} If the dependency name is invalid (not a non-empty string).
     * @throws {Error} If `factory` option is true but `dependency` is not a function.
     */
    register(name, dependency, options = {}) {
        if (typeof name !== 'string' || name.trim() === '') {
            throw new Error('Injector: Dependency name must be a non-empty string.');
        }

        // Detect if the dependency is an ES6 class constructor.
        const isClassConstructor = typeof dependency === 'function' && /^\s*class\s/.test(dependency.toString());

        const isFactoryExplicitlySet = options.factory === true;
        const isFactory = isFactoryExplicitlySet || isClassConstructor;

        if (isFactoryExplicitlySet && typeof dependency !== 'function') {
            throw new Error(`Injector: Dependency "${name}" registered with 'factory: true' but is not a function or class.`);
        }

        if (this.dependencies.has(name)) {
            const existingDef = this.dependencies.get(name);
            if (existingDef.singleton) {
                // Clear existing singleton instance to ensure the new definition is used.
                this.singletons.delete(name);
            }
        }

        this.dependencies.set(name, {
            dependency,
            singleton: options.singleton === true,
            factory: isFactory
        });
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
            if (this.singletons.has(name)) {
                return this.singletons.get(name);
            }

            let instance;
            if (factory) {
                instance = this._instantiate(dependency);
            } else {
                instance = dependency;
            }
            this.singletons.set(name, instance);
            return instance;
        } else {
            if (factory) {
                return this._instantiate(dependency);
            } else {
                return dependency;
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
     * This is typically used for testing or application state resets.
     */
    clear() {
        this.dependencies.clear();
        this.singletons.clear();
    }

    /**
     * Internal helper method to instantiate a dependency.
     * If the dependency is an ES6 class constructor, it is instantiated with `new`.
     * If it is a factory function, it is invoked, passing the injector itself for nested dependency resolution.
     *
     * @private
     * @param {function} dependency - The class constructor or factory function to instantiate.
     * @returns {any} The instantiated object.
     * @throws {Error} If `dependency` is not a function when expected to be a factory.
     */
    _instantiate(dependency) {
        if (typeof dependency === 'function') {
            // Check if it's an ES6 class constructor.
            if (/^\s*class\s/.test(dependency.toString())) {
                return new dependency();
            } else {
                // Assume it's a factory function and invoke it, passing the injector.
                return dependency(this);
            }
        }
        // This error should ideally be prevented by the `register` method's validation,
        // but serves as a robust safeguard.
        throw new Error('Injector: Internal error: Attempted to instantiate a non-function dependency marked as factory.');
    }
}

/**
 * A default, globally accessible instance of the Injector.
 * This instance can be imported and utilized directly for centralized dependency management.
 * @type {Injector}
 */
const defaultInjector = new Injector();

export {
    Injector,
    defaultInjector
};