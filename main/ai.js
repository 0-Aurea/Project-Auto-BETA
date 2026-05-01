import axios from 'axios';

/**
 * A client for interacting with AI APIs (e.g., OpenAI, Google AI).
 * This class provides a structured way to make requests to various AI services,
 * handling authentication and common request patterns.
 */
class AIClient {
  /**
   * Creates an instance of AIClient.
   * @param {string} apiKey The API key for authentication with the AI service.
   *                        It's recommended to load this from environment variables.
   * @param {string} [baseUrl='https://api.openai.com/v1'] The base URL of the AI API.
   * @param {number} [timeout=60000] The request timeout in milliseconds.
   */
  constructor(apiKey, baseUrl = 'https://api.openai.com/v1', timeout = 60000) {
    if (!apiKey) {
      throw new Error('AIClient requires an API key.');
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;

    // Create an Axios instance for consistent headers and error handling
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      timeout: timeout,
    });
  }

  /**
   * Sends a chat completion request to the AI service.
   * This method is designed to be compatible with OpenAI's chat completion API.
   * @param {Array<Object>} messages An array of message objects, typically { role: string, content: string }.
   *                                 Example: [{ role: 'user', content: 'Hello!' }]
   * @param {string} [model='gpt-3.5-turbo'] The AI model to use for the completion.
   * @param {Object} [options={}] Additional options for the completion request (e.g., temperature, max_tokens, stream).
   * @returns {Promise<Object>} A promise that resolves with the AI's response data.
   * @throws {Error} If the API request fails or returns an error.
   */
  async getChatCompletion(messages, model = 'gpt-3.5-turbo', options = {}) {
    try {
      const response = await this.axiosInstance.post('/chat/completions', {
        model: model,
        messages: messages,
        ...options, // Allow overriding other parameters like temperature, max_tokens, etc.
      });
      return response.data;
    } catch (error) {
      console.error('Error getting chat completion:', error.response ? error.response.data : error.message);
      throw new Error(`Failed to get chat completion: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
  }

  /**
   * Sends a text embedding request to the AI service.
   * This method is designed to be compatible with OpenAI's embedding API.
   * @param {string|Array<string>} input The text or array of texts to embed.
   * @param {string} [model='text-embedding-ada-002'] The embedding model to use.
   * @param {Object} [options={}] Additional options for the embedding request.
   * @returns {Promise<Object>} A promise that resolves with the AI's embedding response data.
   * @throws {Error} If the API request fails or returns an error.
   */
  async getEmbeddings(input, model = 'text-embedding-ada-002', options = {}) {
    try {
      const response = await this.axiosInstance.post('/embeddings', {
        model: model,
        input: input,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting embeddings:', error.response ? error.response.data : error.message);
      throw new Error(`Failed to get embeddings: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
  }

  /**
   * Generic method to make a POST request to a specific AI endpoint.
   * Can be used to extend functionality or interact with non-standard endpoints.
   * @param {string} endpoint The API endpoint (e.g., '/images/generations').
   * @param {Object} data The request body data.
   * @returns {Promise<Object>} A promise that resolves with the API's response data.
   * @throws {Error} If the API request fails.
   */
  async post(endpoint, data) {
    try {
      const response = await this.axiosInstance.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error making POST request to ${endpoint}:`, error.response ? error.response.data : error.message);
      throw new Error(`Failed POST to ${endpoint}: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
  }

  // You can add more specific methods here for other AI functionalities
  // like image generation, speech-to-text, etc., using the generic `post` method.
}

export default AIClient;