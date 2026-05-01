const CORE_MODULE_PATH = '../main/index.js';
const STATUS_DIV_ID = 'app-loader-status';

function createStatusDiv() {
    let statusDiv = document.getElementById(STATUS_DIV_ID);
    if (!statusDiv && document.body) {
        statusDiv = document.createElement('div');
        statusDiv.id = STATUS_DIV_ID;
        Object.assign(statusDiv.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            color: '#E0E0E0',
            padding: '10px 20px',
            borderRadius: '8px',
            fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: '9999',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            transition: 'opacity 0.5s ease, background-color 0.3s ease',
            opacity: '1'
        });
        document.body.appendChild(statusDiv);
    } else if (!document.body) {
        console.error('Error: document.body not found. Cannot append status div.');
        return null;
    }
    return statusDiv;
}

function updateStatus(statusDiv, message, type) {
    if (!statusDiv) return;

    statusDiv.textContent = message;
    let bgColor;
    switch (type) {
        case 'success':
            bgColor = 'rgba(20, 100, 20, 0.9)';
            break;
        case 'error':
            bgColor = 'rgba(0, 50, 100, 0.9)';
            break;
        case 'initial':
        default:
            bgColor = 'rgba(30, 30, 30, 0.9)';
            break;
    }
    statusDiv.style.backgroundColor = bgColor;
    statusDiv.style.opacity = '1';
}

function fadeOutStatus(statusDiv, delayMs = 3000) {
    if (!statusDiv) return;
    setTimeout(() => {
        statusDiv.style.opacity = '0';
        setTimeout(() => {
            if (statusDiv && statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 500);
    }, delayMs);
}

document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = createStatusDiv();
    if (!statusDiv) return;

    updateStatus(statusDiv, 'Initializing Noodles...', 'initial');

    try {
        const mainModule = await import(CORE_MODULE_PATH);

        if (typeof mainModule.init === 'function') {
            mainModule.init();
            updateStatus(statusDiv, 'Noodles operational.', 'success');
            fadeOutStatus(statusDiv, 2000);
        } else {
            console.error('Core module loaded, but no "init" function found for application setup.');
            updateStatus(statusDiv, 'Noodles setup error. See console.', 'error');
            fadeOutStatus(statusDiv, 5000);
        }
    } catch (error) {
        console.error(`Failed to load or initialize core module from ${CORE_MODULE_PATH}:`, error);
        updateStatus(statusDiv, 'Noodles initialization failed. See console.', 'error');
        fadeOutStatus(statusDiv, 8000);
    }
});