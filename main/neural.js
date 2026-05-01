/**
 * Global Noodles namespace for core application logic and utilities.
 * This object orchestrates attack dispatch, target validation, and statistics management.
 *
 * @namespace Noodles
 */
const Noodles = (() => {
    // --- Private State ---
    /**
     * @private
     * @type {object}
     * @property {object|null} currentAttack - Details of the active attack, or null if idle.
     * @property {number|null} attackStartTime - Timestamp (ms) when the current attack started, or null.
     * @property {object} statistics - Current application statistics.
     * @property {number} statistics.mbps - Megabits per second.
     * @property {number} statistics.packets - Number of packets sent.
     * @property {string} statistics.status - Current operational status (e.g., 'Idle', 'Attacking').
     * @property {string} statistics.elapsedTime - Formatted elapsed time of the current attack.
     */
    const _state = {
        currentAttack: null,
        attackStartTime: null,
        statistics: {
            mbps: 0,
            packets: 0,
            status: 'Idle',
            elapsedTime: '00:00:00'
        }
    };

    /**
     * @private
     * @type {number|null} _elapsedTimer - The interval ID for the elapsed time update timer.
     */
    let _elapsedTimer = null;

    // --- Private Utility Functions ---

    /**
     * Internal utility for logging messages.
     * @private
     * @param {string} message - The message to log.
     * @param {string} [level='info'] - Log level (e.g., 'info', 'warn', 'error', 'debug').
     */
    const _log = (message, level = 'info') => {
        const timestamp = new Date().toISOString();
        // Ensure the level exists on console, default to 'info' if not.
        const consoleMethod = console[level] || console.info;
        consoleMethod(`[${timestamp}] [Noodles Core] ${message}`);
    };

    /**
     * Validates a given target URL or .onion address.
     * Supports standard HTTP/HTTPS URLs and .onion addresses (v2 and v3).
     * @private
     * @param {string} target - The URL or .onion address to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    const _validateTarget = (target) => {
        if (typeof target !== 'string' || target.trim() === '') {
            _log('Invalid target input: Target must be a non-empty string.', 'error');
            return false;
        }

        // Regex for standard URLs (HTTP/HTTPS) and .onion addresses (v2 and v3)
        // 1. Standard HTTP/HTTPS URL: (https?:\/\/[^\s/$.?#].[^\s]*)
        // 2. v2 .onion address: ([a-z0-9]{16}\.onion(\/[^\s]*)?)
        // 3. v3 .onion address: ([a-z0-9]{56}\.onion(\/[^\s]*)?)
        const urlRegex = new RegExp(
            /^(https?:\/\/[^\s/$.?#].[^\s]*)|/ +
            /(^[a-z0-9]{16}\.onion(\/[^\s]*)?)|/ +
            /(^[a-z0-9]{56}\.onion(\/[^\s]*)?)$/i
        );

        if (!urlRegex.test(target.trim())) {
            _log(`Target "${target}" is not a valid URL or .onion address.`, 'warn');
            return false;
        }
        _log(`Target "${target}" validated successfully.`, 'debug');
        return true;
    };

    /**
     * Generates a unique identifier for an attack.
     * @private
     * @returns {string} A unique attack ID.
     */
    const _generateAttackId = () => {
        return 'attack_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    };

    /**
     * Updates the internal statistics and dispatches a custom event for UI updates.
     * Logs an 'info' message if the status changes, otherwise 'debug'.
     * @private
     * @param {object} newStats - An object containing new statistics data to merge into the current state.
     */
    const _updateStatistics = (newStats) => {
        const oldStatus = _state.statistics.status;
        Object.assign(_state.statistics, newStats);

        const event = new CustomEvent('noodles:statsUpdate', { detail: { ..._state.statistics } });
        document.dispatchEvent(event);

        if (oldStatus !== _state.statistics.status) {
            _log(`Statistics status updated to: ${_state.statistics.status}`, 'info');
        } else {
            _log('Statistics updated.', 'debug');
        }
    };

    /**
     * Calculates and updates the elapsed time for an ongoing attack.
     * Called periodically by a timer.
     * @private
     */
    const _updateElapsedTime = () => {
        if (_state.attackStartTime) {
            const elapsedMilliseconds = Date.now() - _state.attackStartTime;
            const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            _updateStatistics({ elapsedTime: `${hours}:${minutes}:${seconds}` });
        }
    };

    /**
     * Initializes the attack state, sets up initial statistics, and starts the elapsed time timer.
     * This is an internal helper for `startAttack` (public method).
     * @private
     * @param {string} type - The general category of the attack (e.g., 'DDoS', 'Defacement').
     * @param {string} subtype - The specific attack method (e.g., 'HTTPFlood', 'ImageReplacement').
     * @param {string} target - The target URL or .onion address.
     * @param {object} [options={}] - Attack-specific configuration options.
     * @returns {string|null} The generated attack ID if state was successfully initialized, otherwise null.
     */
    const _initializeAttackState = (type, subtype, target, options = {}) => {
        if (!_validateTarget(target)) {
            _log('Cannot initialize attack state: Invalid target provided.', 'error');
            _updateStatistics({ status: 'Failed: Invalid Target' });
            return null;
        }

        if (_state.currentAttack) {
            _log('An attack is already active. Please stop it before starting a new one.', 'warn');
            return null;
        }

        const attackId = _generateAttackId();
        _state.currentAttack = { id: attackId, type, subtype, target: target.trim(), options, status: 'Active' };
        _state.attackStartTime = Date.now();
        _log(`Initializing ${type} - ${subtype} attack on ${target.trim()} (ID: ${attackId}) with options:`, 'info');
        console.log(options); // Use console.log for object inspection

        _updateStatistics({
            mbps: 0,
            packets: 0,
            status: `Attacking: ${type} - ${subtype}`,
            elapsedTime: '00:00:00'
        });

        // Clear any existing timer and set a new one
        if (_elapsedTimer) {
            clearInterval(_elapsedTimer);
        }
        _elapsedTimer = setInterval(_updateElapsedTime, 1000);

        return attackId;
    };

    /**
     * Stops the current active attack, resets state, clears the elapsed time timer, and updates statistics.
     * @private
     */
    const _stopAttack = () => {
        if (_state.currentAttack) {
            _log(`Stopping attack ID: ${_state.currentAttack.id}`, 'info');
            _state.currentAttack.status = 'Stopped'; // Update status before clearing the attack object
        } else {
            _log('No active attack to stop.', 'warn');
        }

        _state.currentAttack = null;
        _state.attackStartTime = null;

        if (_elapsedTimer) {
            clearInterval(_elapsedTimer);
            _elapsedTimer = null;
        }

        _updateStatistics({
            mbps: 0,
            packets: 0,
            status: 'Idle',
            elapsedTime: '00:00:00'
        });
    };

    // --- Public API ---

    /**
     * Initializes the Noodles Core module. This method should be called once when the application loads.
     * It sets the initial system status and logs the initialization.
     * @public
     */
    const init = () => {
        _log('Noodles Core initialized. System Ready.', 'info');
        _updateStatistics({ status: 'System Ready' });
    };

    /**
     * Starts an attack by initializing its internal state and then dispatching the command
     * to the relevant attack module (e.g., Noodles.DDoS.HTTPFlood).
     * This is the primary public method for initiating any attack.
     * @public
     * @param {string} attackType - The main category of the attack (e.g., 'DDoS', 'Defacement').
     * @param {string} attackSubtype - The specific attack method (e.g., 'HTTPFlood').
     * @param {string} target - The target URL or .onion address.
     * @param {object} [options={}] - Configuration options specific to the attack.
     * @returns {boolean} True if the attack was successfully initiated and dispatched, false otherwise.
     */
    const startAttack = (attackType, attackSubtype, target, options = {}) => {
        const attackId = _initializeAttackState(attackType, attackSubtype, target, options);
        if (!attackId) {
            // _initializeAttackState already handled logging and status updates
            return false;
        }

        // Attempt to call the specific attack module function
        // Assumes Noodles[attackType] exists and Noodles[attackType][attackSubtype] is a callable function.
        if (Noodles[attackType] && typeof Noodles[attackType][attackSubtype] === 'function') {
            try {
                // Pass the attack ID and current attack state for the module to use
                Noodles[attackType][attackSubtype](target, options, attackId, _state.currentAttack);
                _log(`Successfully dispatched ${attackType} - ${attackSubtype} to module.`, 'info');
                return true;
            } catch (error) {
                _log(`Error dispatching attack ${attackType} - ${attackSubtype}: ${error.message}`, 'error');
                _stopAttack(); // Ensure state is reset if the module call fails
                _updateStatistics({ status: 'Failed: Dispatch Error' });
                return false;
            }
        } else {
            _log(`Attack module or subtype not found: ${attackType}.${attackSubtype}`, 'error');
            _stopAttack(); // Ensure state is reset if the module is not found
            _updateStatistics({ status: 'Failed: Module Not Found' });
            return false;
        }
    };

    /**
     * Public method to stop the current active attack.
     * Delegates to the private `_stopAttack` function.
     * @public
     */
    const stopAttack = () => {
        _stopAttack();
    };

    /**
     * Retrieves the current state of the application, including active attack details and statistics.
     * Returns a deep copy to prevent external modification of the internal state.
     * @public
     * @returns {object} A deep copy of the current application state.
     */
    const getCurrentState = () => {
        return JSON.parse(JSON.stringify(_state)); // Deep copy for immutability
    };

    /**
     * Public method to update application statistics. This can be called by attack modules
     * or other parts of the application to reflect ongoing activity.
     * @public
     * @param {object} newStats - An object containing new statistics data to merge.
     */
    const updateStatistics = (newStats) => {
        _updateStatistics(newStats);
    };

    /**
     * Exposes the internal logging utility for use by other Noodles modules.
     * @public
     * @param {string} message - The message to log.
     * @param {string} [level='info'] - Log level.
     */
    const log = (message, level = 'info') => {
        _log(message, level);
    };

    // Public API for the Noodles module
    return {
        /**
         * Core functionalities of the Noodles application.
         * @memberof Noodles
         * @namespace Core
         */
        Core: {
            init,
            validateTarget: _validateTarget, // Expose for external validation if needed
            startAttack, // The main entry point for starting attacks
            stopAttack,
            updateStatistics,
            getCurrentState,
            log, // Expose internal logger for other modules to use
        },
        // Placeholders for attack modules. These objects will be populated by other scripts
        // that define specific attack methods (e.g., DDoS.HTTPFlood, Defacement.ImageReplacement).
        /** @memberof Noodles */
        DDoS: {},
        /** @memberof Noodles */
        Defacement: {},
        /** @memberof Noodles */
        Connection: {},
        /** @memberof Noodles */
        Ransomware: {},
        /** @memberof Noodles */
        OtherTools: {}
    };
})();

// Initialize the core when the DOM is fully loaded to ensure all elements are available.
document.addEventListener('DOMContentLoaded', Noodles.Core.init);