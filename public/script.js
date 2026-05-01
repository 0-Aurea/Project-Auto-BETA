// Constants for core module path, status div ID, and CSS class names.
const CORE_MODULE_PATH = '../main/index.js'; // Relative path to the main application module.
const STATUS_DIV_ID = 'app-loader-status';

// CSS Class names for styling the status indicator.
const STATUS_CLASS_BASE = 'app-loader-status';
const STATUS_CLASS_INITIAL = 'app-loader-status--initial';
const STATUS_CLASS_SUCCESS = 'app-loader-status--success';
const STATUS_CLASS_ERROR = 'app-loader-status--error';

// Animation and delay constants for status message visibility.
const FADE_OUT_DURATION_MS = 500; // Matches CSS transition duration for smooth fade-out.
const DELAY_SUCCESS_MS = 2000;    // Delay before hiding a success message.
const DELAY_ERROR_MS = 5000;      // Delay before hiding a general error message.
const DELAY_FATAL_ERROR_MS = 8000; // Delay for critical module load failures.

/**
 * Injects a <style> block into the document head with CSS rules for the status div.
 * This approach centralizes style management and allows dynamic class application.
 */
function injectStatusStyles() {
    // Prevent re-injection if styles are already present.
    if (document.getElementById('app-loader-status-styles')) {
        return;
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
            pointer-events: none; /* Allow clicks to pass through elements behind the status div */
        }
        .${STATUS_CLASS_INITIAL} { background-color: rgba(30, 30, 30, 0.9); } /* Dark grey for initial state */
        .${STATUS_CLASS_SUCCESS} { background-color: rgba(20, 100, 20, 0.9); } /* Dark green for success */
        .${STATUS_CLASS_ERROR} { background-color: rgba(0, 50, 100, 0.9); }   /* Dark blue for errors */
    `;
    document.head.appendChild(style);
}

/**
 * Creates and appends a status div to the document body if it doesn't already exist.
 * Applies base styles and accessibility attributes for screen readers.
 * @returns {HTMLElement|null} The created or existing status div element, or null if document.body is not available.
 */
function createStatusDiv() {
    let statusDiv = document.getElementById(STATUS_DIV_ID);
    if (!statusDiv) {
        // Ensure the document body is available before appending elements.
        if (!document.body) {
            console.error('Error: document.body not found. Cannot append status div. Application startup may be affected.');
            return null;
        }

        injectStatusStyles(); // Ensure necessary styles are present in the DOM.

        statusDiv = document.createElement('div');
        statusDiv.id = STATUS_DIV_ID;
        statusDiv.className = STATUS_CLASS_BASE; // Apply base class for general styling.
        statusDiv.setAttribute('role', 'status'); // Accessibility: Designates the element as a live region for status updates.
        statusDiv.setAttribute('aria-live', 'polite'); // Accessibility: Screen readers should announce changes politely without interrupting.

        document.body.appendChild(statusDiv);
    }
    return statusDiv;
}

/**
 * Updates the status div with a given message and applies appropriate styling based on the message type.
 * @param {HTMLElement} statusDiv The status div element to update.
 * @param {string} message The text content to display within the status div.
 * @param {'initial'|'success'|'error'} type The type of status, dictating the background color.
 */
function updateStatus(statusDiv, message, type) {
    if (!statusDiv) return;

    statusDiv.textContent = message;
    statusDiv.style.opacity = '1'; // Ensure the div is fully visible when a new message is displayed.

    // Remove any previously applied type-specific classes to reset background color.
    statusDiv.classList.remove(STATUS_CLASS_INITIAL, STATUS_CLASS_SUCCESS, STATUS_CLASS_ERROR);

    // Add the new type-specific class to update the background color via CSS.
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
 * Hides the status div by fading it out over a period and then removes it from the DOM.
 * This provides a smooth user experience for transient status messages.
 * @param {HTMLElement} statusDiv The status div element to hide and remove.
 * @param {number} delayMs The delay in milliseconds before initiating the fade-out.
 */
function hideAndRemoveStatus(statusDiv, delayMs = 3000) {
    if (!statusDiv) return;

    setTimeout(() => {
        statusDiv.style.opacity = '0'; // Trigger the CSS fade-out transition.
        setTimeout(() => {
            // After the transition completes, safely remove the element from the DOM.
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, FADE_OUT_DURATION_MS); // Wait for the CSS transition duration to complete.
    }, delayMs);
}

/**
 * Main application entry point, executed after the DOM is fully loaded.
 * Handles the loading and initialization of the core application module.
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Attempt to create or retrieve the status indicator div.
    const statusDiv = createStatusDiv();
    if (!statusDiv) {
        console.error('Application startup aborted: Status div could not be created, critical UI feedback is unavailable.');
        return; // Cannot proceed meaningfully if the status div cannot be rendered.
    }

    // Display an initial loading message.
    updateStatus(statusDiv, 'Initializing Noodles...', 'initial');

    try {
        // Dynamically import the core application module.
        const mainModule = await import(CORE_MODULE_PATH);

        // Verify that the core module exports an 'init' function and execute it.
        if (typeof mainModule.init === 'function') {
            mainModule.init();
            updateStatus(statusDiv, 'Noodles operational. Ready for action.', 'success');
            hideAndRemoveStatus(statusDiv, DELAY_SUCCESS_MS);
        } else {
            // Log an error if the 'init' function is missing, indicating a module setup issue.
            console.error(`Core module loaded from ${CORE_MODULE_PATH}, but no 'init' function found for application setup. Ensure mainModule exports an \`init\` function.`);
            updateStatus(statusDiv, 'Noodles setup error. Core module missing "init" function.', 'error');
            hideAndRemoveStatus(statusDiv, DELAY_ERROR_MS);
        }
    } catch (error) {
        // Catch and report any errors during module loading or initialization.
        console.error(`Failed to load or initialize core module from ${CORE_MODULE_PATH}:`, error);
        updateStatus(statusDiv, 'Noodles initialization failed. Critical module load error.', 'error');
        hideAndRemoveStatus(statusDiv, DELAY_FATAL_ERROR_MS);
    }
});