/**
 * This script handles the client-side interactions for a game,
 * connecting to a backend service to perform actions like attacking
 * and updating game state.
 *
 * It assumes the existence of specific HTML elements with IDs:
 * - 'attackButton': A button to trigger an attack.
 * - 'gameStatus': A div or span to display game messages and state.
 *
 * It also assumes backend API endpoints for game actions:
 * - GET /api/game/state: To fetch the current game state.
 * - POST /api/game/attack: To send an attack request.
 */
document.addEventListener('DOMContentLoaded', () => {
    const attackButton = document.getElementById('attackButton');
    const gameStatusDiv = document.getElementById('gameStatus');

    // --- API Endpoints Configuration ---
    const API_ENDPOINTS = {
        gameState: '/api/game/state',
        attack: '/api/game/attack',
    };

    // --- Helper function to update the game status display ---
    function updateStatus(message, type = 'info') {
        if (gameStatusDiv) {
            gameStatusDiv.textContent = message;
            // Reset existing classes
            gameStatusDiv.className = '';
            // Add a class based on message type for styling
            switch (type) {
                case 'error':
                    gameStatusDiv.classList.add('status-error');
                    break;
                case 'success':
                    gameStatusDiv.classList.add('status-success');
                    break;
                case 'loading':
                    gameStatusDiv.classList.add('status-loading');
                    break;
                default: // 'info'
                    gameStatusDiv.classList.add('status-info');
                    break;
            }
            // Optional: You might want to remove previous inline styles if using classes
            gameStatusDiv.style.color = ''; // Clear previous inline color
        } else {
            console.warn('Game status display element not found (ID: gameStatus).');
        }
    }

    // --- Helper function to disable/enable the attack button ---
    function setAttackButtonState(isDisabled) {
        if (attackButton) {
            attackButton.disabled = isDisabled;
            // Optionally change button text or add a loading spinner class
            if (isDisabled) {
                attackButton.textContent = 'Attacking...';
                attackButton.classList.add('is-loading');
            } else {
                attackButton.textContent = 'Attack!';
                attackButton.classList.remove('is-loading');
            }
        }
    }

    // --- Function to fetch and display the current game state from the backend ---
    async function fetchGameState() {
        setAttackButtonState(true); // Disable button while fetching state
        updateStatus('Loading game state...', 'loading');
        try {
            const response = await fetch(API_ENDPOINTS.gameState);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
                throw new Error(`Failed to fetch game state: ${response.status} - ${errorData.message}`);
            }

            const gameState = await response.json();
            if (gameState && typeof gameState.playerHealth !== 'undefined' && typeof gameState.enemyHealth !== 'undefined') {
                updateStatus(`Player: ${gameState.playerHealth} HP | Enemy: ${gameState.enemyHealth} HP`, 'info');
                console.log('Game state updated:', gameState);
            } else {
                throw new Error('Invalid game state received from server.');
            }

        } catch (error) {
            console.error('Error fetching game state:', error);
            updateStatus(`Failed to load game state. ${error.message}`, 'error');
        } finally {
            setAttackButtonState(false); // Re-enable button
        }
    }

    // --- Event listener for the attack button ---
    if (attackButton) {
        attackButton.addEventListener('click', async () => {
            setAttackButtonState(true); // Disable button during attack
            updateStatus('Performing attack...', 'loading');
            try {
                // Send an attack request to the backend
                const response = await fetch(API_ENDPOINTS.attack, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add any necessary authorization headers here (e.g., 'Authorization': 'Bearer YOUR_TOKEN')
                    },
                    // You might send specific attack parameters in the body if needed
                    body: JSON.stringify({ attackType: 'basic_attack', targetId: 'enemy1' }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown server error' }));
                    throw new Error(`Attack failed: ${response.status} - ${errorData.message}`);
                }

                const attackResult = await response.json();
                console.log('Attack result:', attackResult);
                updateStatus(`Attack successful! ${attackResult.message || ''}`, 'success');

                // After a successful attack, refresh the game state to reflect changes
                // Delaying a bit before fetching state can make success message visible longer
                setTimeout(async () => {
                    await fetchGameState();
                }, 1000); // Wait 1 second before refreshing state

            } catch (error) {
                console.error('Error performing attack:', error);
                updateStatus(`Attack failed: ${error.message}`, 'error');
            } finally {
                // The button will be re-enabled by fetchGameState after delay,
                // but we ensure it's re-enabled here if fetchGameState isn't called
                // or if there's an error before it's called.
                // For this flow, fetchGameState always re-enables it.
                // If fetchGameState failed or wasn't called, we'd need to re-enable here.
                // Given the current logic, setAttackButtonState(false) is called by fetchGameState's finally.
            }
        });
    } else {
        console.warn('Attack button element not found (ID: attackButton).');
    }

    // --- Initial setup: Fetch game state when the script loads ---
    fetchGameState();
});