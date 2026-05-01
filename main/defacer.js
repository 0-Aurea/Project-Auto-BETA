/**
 * @class DefacementModule
 * @description Manages the client-side logic for website defacement attacks.
 *              Orchestrates user input, attack type selection, payload management,
 *              and initiates requests to a powerful backend for execution.
 */
class DefacementModule {
    /**
     * @constructor
     * @description Initializes the DefacementModule by binding UI elements and setting up event listeners.
     */
    constructor() {
        // UI Element References
        this.targetInput = document.getElementById('defacementTargetInput');
        this.attackTypeSelect = document.getElementById('defacementTypeSelect');
        this.imagePayloadGroup = document.getElementById('defacementImagePayloadGroup');
        this.imageUrlInput = document.getElementById('defacementImageUrlInput');
        this.textPayloadGroup = document.getElementById('defacementTextPayloadGroup');
        this.textSelectorInput = document.getElementById('defacementTextSelectorInput');
        this.newTextInput = document.getElementById('defacementNewTextInput');
        this.htmlPayloadGroup = document.getElementById('defacementHtmlPayloadGroup');
        this.htmlPayloadInput = document.getElementById('defacementHtmlPayloadInput');
        this.htmlSelectorInput = document.getElementById('defacementHtmlSelectorInput');
        this.executeButton = document.getElementById('executeDefacementButton');
        this.statusDisplay = document.getElementById('defacementStatusDisplay');

        // Critical elements check
        if (!this.targetInput || !this.attackTypeSelect || !this.executeButton || !this.statusDisplay) {
            console.error('DefacementModule: One or more critical UI elements not found. Module cannot function.');
            return;
        }

        this.init();
    }

    /**
     * @method init
     * @description Initializes event listeners for UI interactions and sets initial UI state.
     */
    init() {
        this.attackTypeSelect.addEventListener('change', this.handleAttackTypeChange.bind(this));
        this.executeButton.addEventListener('click', this.handleExecuteAttack.bind(this));
        this.handleAttackTypeChange(); // Set initial visibility
    }

    /**
     * @method handleAttackTypeChange
     * @description Toggles visibility of payload input groups based on the selected attack type.
     */
    handleAttackTypeChange() {
        const selectedType = this.attackTypeSelect.value;

        // Hide all payload groups
        if (this.imagePayloadGroup) this.imagePayloadGroup.style.display = 'none';
        if (this.textPayloadGroup) this.textPayloadGroup.style.display = 'none';
        if (this.htmlPayloadGroup) this.htmlPayloadGroup.style.display = 'none';

        // Show the relevant payload group
        switch (selectedType) {
            case 'image-replacement':
                if (this.imagePayloadGroup) this.imagePayloadGroup.style.display = 'block';
                break;
            case 'text-modification':
                if (this.textPayloadGroup) this.textPayloadGroup.style.display = 'block';
                break;
            case 'html-injection':
                if (this.htmlPayloadGroup) this.htmlPayloadGroup.style.display = 'block';
                break;
            default:
                // No specific payload group for 'none' or unknown types
                break;
        }
    }

    /**
     * @method handleExecuteAttack
     * @description Gathers input, validates, and dispatches the defacement attack request to the backend.
     */
    async handleExecuteAttack() {
        this.clearStatus();
        const target = this.targetInput.value.trim();
        const attackType = this.attackTypeSelect.value;

        if (!this.validateInputs(target, attackType)) {
            return;
        }

        this.updateStatus('Initiating defacement attack...', 'info');
        this.executeButton.disabled = true;

        try {
            let payload = {};
            let endpoint = '';

            switch (attackType) {
                case 'image-replacement':
                    const imageUrl = this.imageUrlInput ? this.imageUrlInput.value.trim() : '';
                    if (!imageUrl) {
                        this.updateStatus('Image URL is required for image replacement.', 'error');
                        return;
                    }
                    payload = { target, imageUrl };
                    endpoint = '/api/defacement/image';
                    break;
                case 'text-modification':
                    const textSelector = this.textSelectorInput ? this.textSelectorInput.value.trim() : '';
                    const newText = this.newTextInput ? this.newTextInput.value.trim() : '';
                    if (!textSelector || !newText) {
                        this.updateStatus('CSS selector and new text are required for text modification.', 'error');
                        return;
                    }
                    payload = { target, selector: textSelector, newText };
                    endpoint = '/api/defacement/text';
                    break;
                case 'html-injection':
                    const htmlPayload = this.htmlPayloadInput ? this.htmlPayloadInput.value.trim() : '';
                    const htmlSelector = this.htmlSelectorInput ? this.htmlSelectorInput.value.trim() : '';
                    if (!htmlPayload) {
                        this.updateStatus('HTML payload is required for HTML injection.', 'error');
                        return;
                    }
                    payload = { target, html: htmlPayload, selector: htmlSelector || null };
                    endpoint = '/api/defacement/html';
                    break;
                default:
                    this.updateStatus('Invalid defacement attack type selected.', 'error');
                    return;
            }

            const response = await this.sendAttackRequest(endpoint, payload);
            if (response.success) {
                this.updateStatus(`Defacement attack (${attackType}) initiated successfully against ${target}. Status: ${response.message}`, 'success');
                this.clearInputs();
            } else {
                this.updateStatus(`Defacement attack (${attackType}) failed: ${response.message}`, 'error');
            }
        } catch (error) {
            console.error('Defacement attack execution error:', error);
            this.updateStatus(`An unexpected error occurred during defacement attack: ${error.message}`, 'error');
        } finally {
            this.executeButton.disabled = false;
        }
    }

    /**
     * @method validateInputs
     * @description Performs client-side validation on the target URL and attack-specific payloads.
     * @param {string} target - The target URL or .onion address.
     * @param {string} attackType - The selected attack type.
     * @returns {boolean} True if inputs are valid, false otherwise.
     */
    validateInputs(target, attackType) {
        if (!target) {
            this.updateStatus('Target URL or .onion address is required.', 'error');
            return false;
        }

        // Robust URL validation for standard and .onion addresses
        const urlRegex = /^(https?:\/\/|http?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}|[a-z0-9]{16}\.onion|[a-z0-9]{56}\.onion)(:\d+)?(\/[^\s]*)?$/i;
        if (!urlRegex.test(target)) {
            this.updateStatus('Invalid target URL or .onion address format. Ensure protocol (http/https) is included for standard URLs.', 'error');
            return false;
        }

        if (attackType === 'none') {
            this.updateStatus('Please select a defacement attack type.', 'error');
            return false;
        }

        return true;
    }

    /**
     * @method sendAttackRequest
     * @description Sends an asynchronous request to the backend API for attack execution.
     * @param {string} endpoint - The API endpoint for the specific attack.
     * @param {object} payload - The data to send with the request.
     * @returns {Promise<object>} The JSON response from the backend.
     * @throws {Error} If the network request fails or the server responds with an error.
     */
    async sendAttackRequest(endpoint, payload) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `HTTP error! Status: ${response.status}`);
            }

            return responseData;
        } catch (error) {
            console.error(`Error sending request to ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * @method updateStatus
     * @description Updates the status display with messages and applies styling based on message type.
     * @param {string} message - The message to display.
     * @param {string} type - The type of message ('info', 'success', 'error').
     */
    updateStatus(message, type = 'info') {
        if (this.statusDisplay) {
            this.statusDisplay.textContent = message;
            this.statusDisplay.className = `status-message status-${type}`;
        }
    }

    /**
     * @method clearStatus
     * @description Clears the status display and resets its styling.
     */
    clearStatus() {
        if (this.statusDisplay) {
            this.statusDisplay.textContent = '';
            this.statusDisplay.className = 'status-message';
        }
    }

    /**
     * @method clearInputs
     * @description Clears all attack-specific input fields and resets the attack type selection.
     */
    clearInputs() {
        // Target input is intentionally not cleared for user convenience
        if (this.imageUrlInput) this.imageUrlInput.value = '';
        if (this.textSelectorInput) this.textSelectorInput.value = '';
        if (this.newTextInput) this.newTextInput.value = '';
        if (this.htmlPayloadInput) this.htmlPayloadInput.value = '';
        if (this.htmlSelectorInput) this.htmlSelectorInput.value = '';

        if (this.attackTypeSelect) this.attackTypeSelect.value = 'none';
        this.handleAttackTypeChange();
    }
}