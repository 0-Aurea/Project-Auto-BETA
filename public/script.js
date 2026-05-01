// public/script.js
// This script initializes the public-facing application by connecting to a core module.

document.addEventListener('DOMContentLoaded', async () => {
    console.log('public/script.js loaded. Initializing connection...');

    const CORE_MODULE_PATH = '../main/index.js'; // Define core module path as a constant for easier modification.
    const STATUS_DIV_ID = 'public-script-status';

    let statusDiv = document.getElementById(STATUS_DIV_ID);

    // Create and append status div if it doesn't exist and document.body is available.
    if (!statusDiv && document.body) {
        statusDiv = document.createElement('div');
        statusDiv.id = STATUS_DIV_ID;
        // Apply basic inline styling for better visibility during loading.
        Object.assign(statusDiv.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '5px',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            zIndex: '9999',
            transition: 'background-color 0.3s ease, opacity 0.5s ease',
        });
        document.body.appendChild(statusDiv);
    } else if (!document.body) {
        console.error('Error: document.body not found. Cannot append status div for loading feedback.');
        // Exit early if the document body is not available to prevent further DOM errors.
        return;
    }

    statusDiv.textContent = 'Loading core module...';
    // Reset background color in case it was previously set to an error state.
    statusDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    statusDiv.style.opacity = '1';

    try {
        console.log(`Attempting to import core module from: ${CORE_MODULE_PATH}`);
        // Dynamically import the main application module.
        const mainModule = await import(CORE_MODULE_PATH);
        console.log(`Core module ${CORE_MODULE_PATH} loaded successfully.`);

        let initializationMessage = '';
        let success = false;

        // Attempt to initialize the application using exported functions.
        if (typeof mainModule.setupApp === 'function') {
            console.log('Calling mainModule.setupApp()...');
            mainModule.setupApp();
            initializationMessage = 'Core module loaded and setupApp() called.';
            success = true;
        } else if (typeof mainModule.default === 'function') {
            console.log('Calling mainModule default export function...');
            mainModule.default();
            initializationMessage = 'Core module loaded and default export called.';
            success = true;
        } else {
            console.warn('Core module loaded, but no "setupApp" function or default export found for initialization.');
            console.log('Available exports:', Object.keys(mainModule));
            initializationMessage = 'Core module loaded, but no primary setup function found.';
        }

        statusDiv.textContent = initializationMessage;
        if (success) {
            statusDiv.style.backgroundColor = 'rgba(40, 167, 69, 0.7)'; // Green for successful initialization.
            // Fade out and remove the status message after a short delay for a cleaner UI.
            setTimeout(() => {
                if (statusDiv) {
                    statusDiv.style.opacity = '0';
                    setTimeout(() => {
                        if (statusDiv && statusDiv.parentNode) {
                            statusDiv.parentNode.removeChild(statusDiv);
                        }
                    }, 500); // Allow time for fade-out transition.
                }
            }, 3000); // Keep message visible for 3 seconds before fading.
        } else {
            statusDiv.style.backgroundColor = 'rgba(255, 193, 7, 0.7)'; // Yellow/orange for warning (loaded but no main setup).
        }

        // Example: Utilize another specific utility exported by the main module.
        if (typeof mainModule.logMessage === 'function') {
            mainModule.logMessage('Message from public/script.js via core module utility.');
        }

    } catch (error) {
        console.error(`Failed to load or initialize core module from ${CORE_MODULE_PATH}:`, error);
        console.error('Please verify:');
        console.error(`  1. "${CORE_MODULE_PATH}" exists and is accessible.`);
        console.error('  2. It is a valid ES module.');
        console.error(`  3. The import path is correct (e.g., if entry is "main.js", update the CORE_MODULE_PATH constant to "../main/main.js").`);
        console.error('  4. Your HTML script tag for public/script.js has type="module" (though dynamic import handles this internally, it\'s good practice for the main script).');

        statusDiv.textContent = `Error loading core module. Check console for details.`;
        statusDiv.style.backgroundColor = 'rgba(220, 53, 69, 0.8)'; // Red for error.
        statusDiv.style.color = 'white';
        statusDiv.style.opacity = '1'; // Ensure error message remains visible.
    }
});