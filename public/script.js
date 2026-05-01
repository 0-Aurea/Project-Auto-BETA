const CORE_MODULE_PATH = '../main/index.js';
const STATUS_DIV_ID = 'app-loader-status';

// CSS Class names for styling
const STATUS_CLASS_BASE = 'app-loader-status';
const STATUS_CLASS_INITIAL = 'app-loader-status--initial';
const STATUS_CLASS_SUCCESS = 'app-loader-status--success';
const STATUS_CLASS_ERROR = 'app-loader-status--error';

// Animation and delay constants
const FADE_OUT_DURATION_MS = 500; // Matches CSS transition duration
const DELAY_SUCCESS_MS = 2000;
const DELAY_ERROR_MS = 5000;
const DELAY_FATAL_ERROR_MS = 8000; // For module load failure

/**
 * Injects a <style> block into the document head with CSS rules for the status div.
 * This allows managing background colors via classes rather than direct style manipulation.
 */
function injectStatusStyles() {
    if (document.getElementById('app-loader-status-styles')) {
        return; // Styles already injected
    }

    const style = document.createElement('style');
    style.id = 'app-loader-status-styles';
    style.textContent = `
        .${STATUS_CLASS_BASE} {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: #E0E0E0;
            padding: 10px 20px;
            border-radius: 8px;
            font-family: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
            font-size: 14px;
            font-weight: 600;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            transition: opacity ${FADE_OUT_DURATION_MS / 1000}s ease, background-color 0.3s ease;
            opacity: 1; /* Default to visible */
            pointer-events: none; /* Allow clicks to pass through */
        }
        .${STATUS_CLASS_INITIAL} { background-color: rgba(30, 30, 30, 0.9); }
        .${STATUS_CLASS_SUCCESS} { background-color: rgba(20, 100, 20, 0.9); }
        .${STATUS_CLASS_ERROR} { background-color: rgba(0, 50, 100, 0.9); }
        /* .${STATUS_CLASS_BASE}.hidden { opacity: 0; } - Removed, using direct style.opacity for fade out */
    `;
    document.head.appendChild(style);
}

/**
 * Creates and appends a status div to the document body if it doesn't already exist.
 * Applies base styles and accessibility attributes.
 * @returns {HTMLElement|null} The created or existing status div, or null if document.body is not available.
 */
function createStatusDiv() {
    let statusDiv = document.getElementById(STATUS_DIV_ID);
    if (!statusDiv) {
        if (!document.body) {
            console.error('Error: document.body not found. Cannot append status div. Application startup may be affected.');
            return null;
        }

        injectStatusStyles(); // Ensure styles are present

        statusDiv = document.createElement('div');
        statusDiv.id = STATUS_DIV_ID;
        statusDiv.className = STATUS_CLASS_BASE; // Add base class for styling
        statusDiv.setAttribute('role', 'status'); // Accessibility: Live region for status updates
        statusDiv.setAttribute('aria-live', 'polite'); // Accessibility: Announce changes politely

        document.body.appendChild(statusDiv);
    }
    return statusDiv;
}

/**
 * Updates the status div with a message and applies appropriate styling based on type.
 * @param {HTMLElement} statusDiv The status div element.
 * @param {string} message The message to display.
 * @param {'initial'|'success'|'error'} type The type of status.
 */
function updateStatus(statusDiv, message, type) {
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.style.opacity = '1'; // Ensure the div is visible when updating

    // Remove any existing type-specific classes
    statusDiv.classList.remove(STATUS_CLASS_INITIAL, STATUS_CLASS_SUCCESS, STATUS_CLASS_ERROR);

    // Add the new type-specific class to change background color
    switch (type) {
        case 'success':
            statusDiv.classList.add(STATUS_CLASS_SUCCESS);
            break;
        case 'error':
            statusDiv.classList.add(STATUS_CLASS_ERROR);
            break;
        case 'initial':
        default:
            statusDiv.classList.add(STATUS_CLASS_INITIAL);
            break;
    }
}

/**
 * Hides the status div by fading it out and then removes it from the DOM.
 * @param {HTMLElement} statusDiv The status div element.
 * @param {number} delayMs The delay before starting the fade-out.
 */
function hideAndRemoveStatus(statusDiv, delayMs = 3000) {
    if (!statusDiv) return;

    setTimeout(() => {
        statusDiv.style.opacity = '0'; // Start the CSS fade-out transition
        setTimeout(() => {
            // After the transition completes, remove the element from the DOM
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, FADE_OUT_DURATION_MS); // Wait for the CSS transition duration
    }, delayMs);
}

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = createStatusDiv();
    if (!statusDiv) {
        console.error('Application startup aborted: Status div could not be created, critical UI feedback is unavailable.');
        return; // Cannot proceed meaningfully without a status div for feedback
    }

    updateStatus(statusDiv, 'Initializing Noodles...', 'initial');

    try {
        const mainModule = await import(CORE_MODULE_PATH);

        if (typeof mainModule.init === 'function') {
            mainModule.init();
            updateStatus(statusDiv, 'Noodles operational.', 'success');
            hideAndRemoveStatus(statusDiv, DELAY_SUCCESS_MS);
        } else {
            console.error('Core module loaded, but no "init" function found for application setup. Ensure mainModule exports an `init` function.');
            updateStatus(statusDiv, 'Noodles setup error. See console for details.', 'error');
            hideAndRemoveStatus(statusDiv, DELAY_ERROR_MS);
        }
    } catch (error) {
        console.error(`Failed to load or initialize core module from ${CORE_MODULE_PATH}:`, error);
        updateStatus(statusDiv, 'Noodles initialization failed. See console for details.', 'error');
        hideAndRemoveStatus(statusDiv, DELAY_FATAL_ERROR_MS);
    }
});