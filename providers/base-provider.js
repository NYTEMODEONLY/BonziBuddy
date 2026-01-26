/**
 * Base class for AI providers.
 * All providers must implement these methods.
 */
class BaseProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || '';
    this.model = config.model || '';
    this.baseUrl = config.baseUrl || '';
  }

  /**
   * Get the provider name for display
   * @returns {string}
   */
  getProviderName() {
    throw new Error('getProviderName must be implemented');
  }

  /**
   * Get the provider ID
   * @returns {string}
   */
  getProviderId() {
    throw new Error('getProviderId must be implemented');
  }

  /**
   * Get available models for this provider
   * @returns {Array<{id: string, name: string}>}
   */
  getAvailableModels() {
    throw new Error('getAvailableModels must be implemented');
  }

  /**
   * Check if API key is required for this provider
   * @returns {boolean}
   */
  requiresApiKey() {
    return true;
  }

  /**
   * Validate the API key
   * @returns {boolean}
   */
  validateApiKey() {
    if (!this.requiresApiKey()) return true;
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Format messages for the provider's API
   * @param {Array} conversationHistory - Array of {role, content} messages
   * @param {string} systemPrompt - The system prompt
   * @returns {Object} Provider-specific message format
   */
  formatMessages(conversationHistory, systemPrompt) {
    throw new Error('formatMessages must be implemented');
  }

  /**
   * Get headers for API request
   * @returns {Object}
   */
  getHeaders() {
    throw new Error('getHeaders must be implemented');
  }

  /**
   * Get the API endpoint URL
   * @returns {string}
   */
  getEndpoint() {
    throw new Error('getEndpoint must be implemented');
  }

  /**
   * Build the request body
   * @param {Object} formattedMessages - Output from formatMessages
   * @param {number} maxTokens - Maximum tokens for response
   * @returns {Object}
   */
  buildRequestBody(formattedMessages, maxTokens) {
    throw new Error('buildRequestBody must be implemented');
  }

  /**
   * Extract the response text from the API response
   * @param {Object} responseData - The parsed JSON response
   * @returns {string}
   */
  extractResponse(responseData) {
    throw new Error('extractResponse must be implemented');
  }

  /**
   * Send a message to the AI provider
   * @param {Array} conversationHistory - Array of {role, content} messages
   * @param {string} systemPrompt - The system prompt
   * @param {number} maxTokens - Maximum tokens for response
   * @returns {Promise<{response?: string, error?: string}>}
   */
  async sendMessage(conversationHistory, systemPrompt, maxTokens = 256) {
    if (!this.validateApiKey()) {
      return { error: `No API key configured for ${this.getProviderName()}. Please set your API key in Settings.` };
    }

    try {
      const formattedMessages = this.formatMessages(conversationHistory, systemPrompt);
      const requestBody = this.buildRequestBody(formattedMessages, maxTokens);

      const response = await fetch(this.getEndpoint(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = this.extractErrorMessage(errorData, response.status);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const responseText = this.extractResponse(data);
      return { response: responseText };
    } catch (error) {
      return { error: error.message || `Failed to get response from ${this.getProviderName()}` };
    }
  }

  /**
   * Extract error message from API response
   * @param {Object} errorData - The error response data
   * @param {number} status - HTTP status code
   * @returns {string}
   */
  extractErrorMessage(errorData, status) {
    return errorData.error?.message || `API request failed with status ${status}`;
  }

  /**
   * Test the connection to the provider
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testConnection() {
    const result = await this.sendMessage(
      [{ role: 'user', content: 'Say "connected" and nothing else.' }],
      'You are a helpful assistant. Respond with exactly one word.',
      10
    );

    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true };
  }
}

module.exports = BaseProvider;
