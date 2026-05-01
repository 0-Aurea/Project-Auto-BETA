// public/script.js
// This script is designed to connect to functionality provided from the ../main/ directory.

document.addEventListener('DOMContentLoaded', async () => {
    console.log('public/script.js loaded. Attempting to connect to main module...');

    try {
        // Dynamically import the main module from the ../main/ directory.
        // This assumes that '../main/' contains an entry file (e.g., 'index.js' or 'main.js')
        // that is an ES module and exports the functionality needed here.
        // Adjust the path 'index.js' if your main module's entry point is named differently.
        const mainModule = await import('../main/index.js');

        // If the main module exports a specific initialization function (e.g., 'setupApp'):
        if (typeof mainModule.setupApp === 'function') {
            console.log('Successfully loaded ../main/index.js and found setupApp function.');
            mainModule.setupApp(); // Call the setup function from the main module
        }
        // If the main module uses a default export for its primary function:
        else if (typeof mainModule.default === 'function') {
            console.log('Successfully loaded ../main/index.js and found a default export function.');
            mainModule.default(); // Call the default export function
        }
        // If neither a specific 'setupApp' nor a default function is found:
        else {
            console.warn('Loaded ../main/index.js, but no "setupApp" function or default export found.');
            console.log('Available exports from mainModule:', Object.keys(mainModule));
        }

        // Example: If the main module exports other specific utilities like 'logMessage':
        if (typeof mainModule.logMessage === 'function') {
            mainModule.logMessage('Message from public/script.js via main module.');
        }

    } catch (error) {
        console.error('Failed to load or connect to module from ../main/index.js:', error);
        console.error('Please ensure "../main/index.js" exists, is a valid ES module, and exports the expected functionality.');
        console.error('If the main entry file is named differently (e.g., main.js, app.js), adjust the import path accordingly.');
        console.error('Also, ensure your HTML script tag for public/script.js has type="module" if you are not using dynamic import, or that your build process handles module resolution.');
    }

    // Add any public/script.js specific initialization or UI logic here.
    const statusDiv = document.createElement('div');
    statusDiv.id = 'public-script-status';
    statusDiv.textContent = 'Public script has finished its loading routine and attempted connection.';
    document.body.appendChild(statusDiv);
});