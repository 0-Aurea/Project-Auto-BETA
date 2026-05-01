/**
 * This script handles the client-side interactions for a game,
 * connecting to a backend service (conceptually referred to as '../main')
 * to perform actions like attacking and updating game state.
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

    // --- Helper function to update the game status display ---
    function updateStatus(message, isError = false) {
        if (gameStatusDiv) {
            gameStatusDiv.textContent = message;
            gameStatusDiv.style.color = isError ? 'red' : 'black';
        } else {
            console.warn('Game status display element not found (ID: gameStatus).');
        }
    }

    // --- Function to fetch and display the current game state from the backend ---
    async function fetchGameState() {
        try {
            updateStatus('Loading game state...');
            const response = await fetch('/api/game/state');

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`Failed to fetch game state: ${response.status} - ${errorData.message}`);
            }

            const gameState = await response.json();
            updateStatus(`Player: ${gameState.playerHealth} HP | Enemy: ${gameState.enemyHealth} HP`);
            console.log('Game state updated:', gameState);

        } catch (error) {
            console.error('Error fetching game state:', error);
            updateStatus(`Failed to load game state. ${error.message}`, true);
        }
    }

    // --- Event listener for the attack button ---
    if (attackButton) {
        attackButton.addEventListener('click', async () => {
            updateStatus('Performing attack...');
            try {
                // Send an attack request to the backend
                const response = await fetch('/api/game/attack', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add any necessary authorization headers here (e.g., 'Authorization': 'Bearer YOUR_TOKEN')
                    },
                    // You might send specific attack parameters in the body if needed
                    body: JSON.stringify({ attackType: 'basic_attack', targetId: 'enemy1' }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(`Attack failed: ${response.status} - ${errorData.message}`);
                }

                const attackResult = await response.json();
                console.log('Attack result:', attackResult);
                updateStatus(`Attack successful! ${attackResult.message || ''}`);

                // After a successful attack, refresh the game state to reflect changes
                await fetchGameState();

            } catch (error) {
                console.error('Error performing attack:', error);
                updateStatus(`Attack failed: ${error.message}`, true);
            }
        });
    } else {
        console.warn('Attack button element not found (ID: attackButton).');
    }


    // --- Initial setup: Fetch game state when the script loads ---
    fetchGameState();
});