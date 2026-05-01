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
        const consoleMethod = console[level] || console.info;
        consoleMethod(`[${timestamp}] [Noodles Core] ${message}`);
    };

    /**
     * Validates and normalizes a given target URL or .onion address.
     * Supports standard HTTP/HTTPS URLs and .onion addresses (v2 and v3).
     * Automatically prepends 'https://' if no protocol is specified for non-.onion targets.
     * @private
     * @param {string} target - The URL or .onion address to validate.
     * @returns {string|boolean} The normalized target string if valid, false otherwise.
     */
    const _validateTarget = (target) => {
        if (typeof target !== 'string' || target.trim() === '') {
            _log('Invalid target input: Target must be a non-empty string.', 'error');
            return false;
        }

        let normalizedTarget = target.trim();

        // If it's not an onion address and doesn't start with http(s)://, prepend https://
        if (!normalizedTarget.match(/^[a-z0-9]{16}\.onion(\/[^\s]*)?$/i) &&
            !normalizedTarget.match(/^[a-z0-9]{56}\.onion(\/[^\s]*)?$/i) &&
            !normalizedTarget.startsWith('http://') &&
            !normalizedTarget.startsWith('https://')) {
            normalizedTarget = 'https://' + normalizedTarget;
        }

        // Regex for standard URLs (HTTP/HTTPS) and .onion addresses (v2 and v3)
        const urlRegex = new RegExp(
            /^(https?:\/\/[^\s/$.?#].[^\s]*)|/ +
            /(^[a-z0-9]{16}\.onion(\/[^\s]*)?)|/ +
            /(^[a-z0-9]{56}\.onion(\/[^\s]*)?)$/i
        );

        if (!urlRegex.test(normalizedTarget)) {
            _log(`Target "${target}" (normalized to "${normalizedTarget}") is not a valid URL or .onion address.`, 'warn');
            return false;
        }
        _log(`Target "${target}" validated successfully (normalized to "${normalizedTarget}").`, 'debug');
        return normalizedTarget;
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
     * @private
     * @param {string} type - The general category of the attack (e.g., 'DDoS', 'Defacement').
     * @param {string} subtype - The specific attack method (e.g., 'HTTPFlood', 'ImageReplacement').
     * @param {string} target - The target URL or .onion address.
     * @param {object} [options={}] - Attack-specific configuration options.
     * @returns {string|null} The generated attack ID if state was successfully initialized, otherwise null.
     */
    const _initializeAttackState = (type, subtype, target, options = {}) => {
        const validatedTarget = _validateTarget(target);
        if (!validatedTarget) {
            _log('Cannot initialize attack state: Invalid target provided.', 'error');
            _updateStatistics({ status: 'Failed: Invalid Target' });
            return null;
        }

        if (_state.currentAttack) {
            _log('An attack is already active. Please stop it before starting a new one.', 'warn');
            return null;
        }

        const attackId = _generateAttackId();
        _state.currentAttack = { id: attackId, type, subtype, target: validatedTarget, options, status: 'Active' };
        _state.attackStartTime = Date.now();
        _log(`Initializing ${type} - ${subtype} attack on ${validatedTarget} (ID: ${attackId}) with options: ${JSON.stringify(options)}`, 'info');

        _updateStatistics({
            mbps: 0,
            packets: 0,
            status: `Attacking: ${type} - ${subtype}`,
            elapsedTime: '00:00:00'
        });

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
            _state.currentAttack.status = 'Stopped';
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
     * Initializes the Noodles Core module.
     * @public
     */
    const init = () => {
        _log('Noodles Core initialized. System Ready.', 'info');
        _updateStatistics({ status: 'System Ready' });
    };

    /**
     * Starts an attack by initializing its internal state and then dispatching the command
     * to the relevant attack module.
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
            return false;
        }

        if (Noodles[attackType] && typeof Noodles[attackType][attackSubtype] === 'function') {
            try {
                Noodles[attackType][attackSubtype](_state.currentAttack.target, options, attackId, _state.currentAttack);
                _log(`Successfully dispatched ${attackType} - ${attackSubtype} to module.`, 'info');
                return true;
            } catch (error) {
                _log(`Error dispatching attack ${attackType} - ${attackSubtype}: ${error.message}`, 'error');
                _stopAttack();
                _updateStatistics({ status: 'Failed: Dispatch Error' });
                return false;
            }
        } else {
            _log(`Attack module or subtype not found: ${attackType}.${attackSubtype}`, 'error');
            _stopAttack();
            _updateStatistics({ status: 'Failed: Module Not Found' });
            return false;
        }
    };

    /**
     * Public method to stop the current active attack.
     * @public
     */
    const stopAttack = () => {
        _stopAttack();
    };

    /**
     * Retrieves the current state of the application.
     * @public
     * @returns {object} A deep copy of the current application state.
     */
    const getCurrentState = () => {
        return JSON.parse(JSON.stringify(_state));
    };

    /**
     * Public method to update application statistics.
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
            validateTarget: _validateTarget,
            startAttack,
            stopAttack,
            updateStatistics,
            getCurrentState,
            log,
        },
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

document.addEventListener('DOMContentLoaded', Noodles.Core.init);