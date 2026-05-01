// public/script.js
// This script initializes the public-facing application by connecting to a core module.

document.addEventListener('DOMContentLoaded', async () => {
    console.log('public/script.js loaded. Initializing connection...');

    const statusDiv = document.createElement('div');
    statusDiv.id = 'public-script-status';
    statusDiv.textContent = 'Loading core module...';
    document.body.appendChild(statusDiv);

    try {
        // Dynamically import the main application module from the '../main/' directory.
        // It's assumed to be an ES module exporting necessary functionality.
        // Adjust the path 'index.js' if your main module's entry point is different (e.g., 'app.js').
        const mainModule = await import('../main/index.js');
        console.log('Core module ../main/index.js loaded successfully.');

        // Attempt to initialize the application using exported functions.
        if (typeof mainModule.setupApp === 'function') {
            console.log('Calling mainModule.setupApp()...');
            mainModule.setupApp();
            statusDiv.textContent = 'Core module loaded and setupApp() called.';
        } else if (typeof mainModule.default === 'function') {
            console.log('Calling mainModule default export function...');
            mainModule.default();
            statusDiv.textContent = 'Core module loaded and default export called.';
        } else {
            console.warn('Core module loaded, but no "setupApp" function or default export found for initialization.');
            console.log('Available exports:', Object.keys(mainModule));
            statusDiv.textContent = 'Core module loaded, but no primary setup function found.';
        }

        // Example: Utilize another specific utility exported by the main module.
        if (typeof mainModule.logMessage === 'function') {
            mainModule.logMessage('Message from public/script.js via core module utility.');
        }

    } catch (error) {
        console.error('Failed to load or initialize core module from ../main/index.js:', error);
        console.error('Please verify:');
        console.error('  1. "../main/index.js" exists and is accessible.');
        console.error('  2. It is a valid ES module.');
        console.error('  3. The import path is correct (e.g., if entry is "main.js", update "index.js" to "main.js").');
        console.error('  4. Your HTML script tag for public/script.js has type="module" if you are not relying solely on dynamic imports (though dynamic import handles this internally).');
        statusDiv.textContent = 'Error loading core module. Check console for details.';
        statusDiv.style.color = 'red';
    }

    // Any public/script.js specific UI or immediate logic can go here.
    // The statusDiv text will have been updated by the try/catch block.
    // If no error and no specific setup function was found, it will still show a 'loaded' message.
    if (!statusDiv.textContent.includes('Error') && !statusDiv.textContent.includes('called') && statusDiv.textContent !== 'Loading core module...') {
        statusDiv.textContent = 'Public script finished routine. Core module loaded, but no specific setup function was invoked.';
    }
});