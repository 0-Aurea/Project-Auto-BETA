/**
 * Global Noodles namespace for core application logic and utilities.
 * This object orchestrates attack dispatch, target validation, and statistics management.
 */
const Noodles = (() => {
    const state = {
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
     * Internal utility for logging.
     * @param {string} message - The message to log.
     * @param {string} level - Log level (info, warn, error).
     */
    const log = (message, level = 'info') => {
        const timestamp = new Date().toISOString();
        console[level](`[${timestamp}] [Noodles Core] ${message}`);
    };

    /**
     * Validates a given target URL or .onion address.
     * @param {string} target - The URL or .onion address to validate.
     * @returns {boolean} True if valid, false otherwise.
     */
    const validateTarget = (target) => {
        if (!target || typeof target !== 'string' || target.trim() === '') {
            log('Invalid target input: Target must be a non-empty string.', 'error');
            return false;
        }
        // Regex for standard URLs (HTTP/HTTPS) and .onion addresses
        const urlRegex = /^(https?:\/\/[^\s/$.?#].[^\s]*)|(^[a-z0-9]{16}\.onion(\/[^\s]*)?)|(^[a-z0-9]{56}\.onion(\/[^\s]*)?)$/i;
        if (!urlRegex.test(target.trim())) {
            log(`Target "${target}" is not a valid URL or .onion address.`, 'warn');
            return false;
        }
        log(`Target "${target}" validated successfully.`);
        return true;
    };

    /**
     * Generates a unique identifier for an attack.
     * @returns {string} A unique attack ID.
     */
    const generateAttackId = () => {
        return 'attack_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    };

    /**
     * Updates the internal statistics and dispatches an event for UI update.
     * @param {object} newStats - An object containing new statistics data.
     */
    const updateStatistics = (newStats) => {
        Object.assign(state.statistics, newStats);
        const event = new CustomEvent('noodles:statsUpdate', { detail: { ...state.statistics } });
        document.dispatchEvent(event);
        log('Statistics updated.', 'debug'); // Changed to debug to reduce console noise
    };

    /**
     * Calculates and updates the elapsed time for an ongoing attack.
     */
    const updateElapsedTime = () => {
        if (state.attackStartTime) {
            const elapsedMilliseconds = Date.now() - state.attackStartTime;
            const totalSeconds = Math.floor(elapsedMilliseconds / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            updateStatistics({ elapsedTime: `${hours}:${minutes}:${seconds}` });
        }
    };

    /**
     * Starts an attack, setting up initial state and statistics.
     * @param {string} type - The type of attack (e.g., 'DDoS', 'Defacement', 'Connection').
     * @param {string} subtype - The specific attack method (e.g., 'HTTPFlood', 'ImageReplacement').
     * @param {string} target - The target URL or .onion address.
     * @param {object} options - Attack-specific options.
     * @returns {boolean} True if attack initiated successfully, false otherwise.
     */
    const startAttack = (type, subtype, target, options = {}) => {
        if (!validateTarget(target)) {
            log('Cannot start attack: Invalid target.', 'error');
            updateStatistics({ status: 'Failed: Invalid Target' });
            return false;
        }

        if (state.currentAttack) {
            log('An attack is already active. Please stop it before starting a new one.', 'warn');
            return false;
        }

        const attackId = generateAttackId();
        state.currentAttack = { id: attackId, type, subtype, target: target.trim(), options, status: 'Active' };
        state.attackStartTime = Date.now();
        log(`Initiating ${type} - ${subtype} attack on ${target.trim()} (ID: ${attackId}) with options:`, 'info');
        console.log(options);

        updateStatistics({
            mbps: 0,
            packets: 0,
            status: `Attacking: ${type} - ${subtype}`,
            elapsedTime: '00:00:00'
        });

        if (Noodles.Core.elapsedTimer) clearInterval(Noodles.Core.elapsedTimer);
        Noodles.Core.elapsedTimer = setInterval(updateElapsedTime, 1000);

        return true;
    };

    /**
     * Stops the current attack, resetting state and statistics.
     */
    const stopAttack = () => {
        if (state.currentAttack) {
            log(`Stopping attack ID: ${state.currentAttack.id}`, 'info');
            state.currentAttack.status = 'Stopped';
        } else {
            log('No active attack to stop.', 'warn');
        }
        state.currentAttack = null;
        state.attackStartTime = null;
        if (Noodles.Core.elapsedTimer) {
            clearInterval(Noodles.Core.elapsedTimer);
            Noodles.Core.elapsedTimer = null;
        }
        updateStatistics({
            mbps: 0,
            packets: 0,
            status: 'Idle',
            elapsedTime: '00:00:00'
        });
    };

    /**
     * Retrieves the current state of the application, including active attack and statistics.
     * @returns {object} The current application state.
     */
    const getCurrentState = () => {
        return { ...state };
    };

    /**
     * Placeholder for dispatching an attack to the relevant module.
     * This method will be called by UI event handlers.
     * @param {string} attackType - The main category of the attack (e.g., 'DDoS', 'Defacement').
     * @param {string} attackSubtype - The specific attack method.
     * @param {string} target - The target URL or .onion address.
     * @param {object} options - Configuration options for the attack.
     */
    const dispatchAttack = (attackType, attackSubtype, target, options) => {
        if (!startAttack(attackType, attackSubtype, target, options)) {
            return false;
        }

        // Call the specific attack module if it exists
        if (Noodles[attackType] && typeof Noodles[attackType][attackSubtype] === 'function') {
            try {
                Noodles[attackType][attackSubtype](target, options);
                log(`Successfully dispatched ${attackType} - ${attackSubtype} to module.`, 'info');
                return true;
            } catch (error) {
                log(`Error dispatching attack ${attackType} - ${attackSubtype}: ${error.message}`, 'error');
                stopAttack();
                updateStatistics({ status: 'Failed: Dispatch Error' });
                return false;
            }
        } else {
            log(`Attack module or subtype not found: ${attackType}.${attackSubtype}`, 'error');
            stopAttack();
            updateStatistics({ status: 'Failed: Module Not Found' });
            return false;
        }
    };

    // Public API for the Noodles Core module
    return {
        Core: {
            init: () => {
                log('Noodles Core initialized. System Ready.', 'info');
                updateStatistics({ status: 'System Ready' });
            },
            validateTarget,
            startAttack: dispatchAttack, // Expose dispatchAttack as the primary start method
            stopAttack,
            updateStatistics,
            getCurrentState,
            log,
            elapsedTimer: null
        },
        DDoS: {},
        Defacement: {},
        Connection: {},
        Ransomware: {},
        OtherTools: {}
    };
})();

// Initialize the core when the script loads
document.addEventListener('DOMContentLoaded', Noodles.Core.init);