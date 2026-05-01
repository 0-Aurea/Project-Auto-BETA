import { promises as fs } from 'fs'; // For asynchronous file operations
import path from 'path';
import { fileURLToPath } from 'url'; // For resolving __dirname in ES Modules

// Determine __dirname for correct file path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the AI memory file
const AI_MEMORY_FILE = path.join(__dirname, 'ai_memory.json');

// Import the AI logic module.
// It is assumed that 'ai.js' exports functions like 'initializeAI' and 'processAIRequest'.
// You would implement the specific AI algorithms and interactions within 'ai.js'.
import { initializeAI, processAIRequest } from './ai.js';

let aiMemory = {}; // In-memory cache for the AI's persistent memory

/**
 * Loads the AI's memory from the 'ai_memory.json' file.
 * If the file does not exist, it initializes with an empty memory object.
 * @returns {Promise<object>} The loaded AI memory.
 * @throws {Error} If there is an error reading or parsing the file (other than ENOENT).
 */
async function loadAIMemory() {
    try {
        const data = await fs.readFile(AI_MEMORY_FILE, 'utf8');
        aiMemory = JSON.parse(data);
        console.log('AI memory loaded successfully.');
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.warn('AI memory file not found. Initializing with empty memory.');
            aiMemory = {}; // Start with an empty memory if the file doesn't exist
        } else {
            console.error('Error loading AI memory:', error);
            throw new Error(`Failed to load AI memory: ${error.message}`);
        }
    }
    return aiMemory;
}

/**
 * Saves the current AI's memory to the 'ai_memory.json' file.
 * The memory is pretty-printed with 2 spaces for readability.
 * @param {object} memory - The memory object to save.
 * @returns {Promise<void>}
 * @throws {Error} If there is an error writing the file.
 */
async function saveAIMemory(memory) {
    try {
        await fs.writeFile(AI_MEMORY_FILE, JSON.stringify(memory, null, 2), 'utf8');
        console.log('AI memory saved successfully.');
    } catch (error) {
        console.error('Error saving AI memory:', error);
        throw new Error(`Failed to save AI memory: ${error.message}`);
    }
}

/**
 * Initializes the main AI manager. This function should be called once
 * during application startup (e.g., when a Node.js server starts).
 * It loads the AI's memory and passes it to the AI module for its own setup.
 * @returns {Promise<void>}
 * @throws {Error} If any step of the initialization fails.
 */
async function initializeManager() {
    console.log('Initializing AI manager...');
    try {
        await loadAIMemory(); // Load existing memory
        await initializeAI(aiMemory); // Initialize the AI with the loaded memory
        console.log('AI manager initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize AI manager:', error);
        // Depending on application criticality, you might want to exit the process
        // process.exit(1);
        throw error; // Re-throw to allow upstream handling
    }
}

/**
 * Handles an incoming request for the AI.
 * This function acts as the primary interface for `script.js` (via an API endpoint)
 * to interact with the AI. It processes the prompt, interacts with the AI module,
 * and ensures any updated memory is persisted.
 * @param {string} prompt - The user's input or request for the AI.
 * @param {object} [context={}] - Optional additional context or parameters for the AI.
 * @returns {Promise<object>} The AI's response, potentially including updated memory.
 * @throws {Error} If the AI request processing fails.
 */
async function handleAIRequest(prompt, context = {}) {
    console.log(`Processing AI request for prompt: "${prompt}"`);
    try {
        // Call the AI module to process the request.
        // It's assumed `processAIRequest` takes the current memory and context,
        // and returns the AI's response. It might also update `aiMemory` directly
        // or return an `updatedMemory` property in its response.
        const aiResponse = await processAIRequest(prompt, aiMemory, context);

        // If the AI module returns an updated memory state, use it.
        if (aiResponse && aiResponse.updatedMemory) {
            aiMemory = aiResponse.updatedMemory;
        }

        await saveAIMemory(aiMemory); // Persist the (potentially updated) memory after each interaction

        return aiResponse;
    } catch (error) {
        console.error('Error handling AI request:', error);
        throw new Error(`Failed to process AI request: ${error.message}`);
    }
}

// Export the core functions so other modules (e.g., an Express server) can use them.
export {
    initializeManager,
    handleAIRequest,
    // Optionally export memory functions if direct external access or testing is needed
    loadAIMemory,
    saveAIMemory
};