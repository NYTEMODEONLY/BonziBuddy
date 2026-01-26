const BaseProvider = require('./base-provider');

/**
 * Custom OpenAI-compatible provider implementation
 * Supports Ollama, LM Studio, and other local/custom endpoints
 */
class CustomProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434/v1';
    this.model = config.model || 'llama2';
  }

  getProviderName() {
    return 'Custom/Local';
  }

  getProviderId() {
    return 'custom';
  }

  getAvailableModels() {
    // For custom providers, models are user-specified
    // Return some common defaults as suggestions
    return [
      { id: 'llama2', name: 'Llama 2 (default)' },
      { id: 'llama3', name: 'Llama 3' },
      { id: 'mistral', name: 'Mistral' },
      { id: 'codellama', name: 'Code Llama' },
      { id: 'phi', name: 'Phi' }
    ];
  }

  requiresApiKey() {
    // Local models typically don't need an API key
    return false;
  }

  formatMessages(conversationHistory, systemPrompt) {
    // Use OpenAI-compatible format
    return [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    // Only add Authorization header if API key is provided
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }

  getEndpoint() {
    // Ensure baseUrl doesn't end with a slash before appending
    const base = this.baseUrl.replace(/\/$/, '');
    return `${base}/chat/completions`;
  }

  buildRequestBody(formattedMessages, maxTokens) {
    return {
      model: this.model,
      max_tokens: maxTokens,
      messages: formattedMessages,
      stream: false
    };
  }

  extractResponse(responseData) {
    // Handle both OpenAI-style and Ollama-style responses
    if (responseData.choices && responseData.choices[0]) {
      return responseData.choices[0].message.content;
    }
    // Fallback for direct message format
    if (responseData.message && responseData.message.content) {
      return responseData.message.content;
    }
    throw new Error('Unexpected response format from custom endpoint');
  }

  extractErrorMessage(errorData, status) {
    // Handle various error formats
    return errorData.error?.message ||
           errorData.error ||
           errorData.message ||
           `Custom endpoint request failed with status ${status}`;
  }

  async testConnection() {
    // For custom providers, we need to be more lenient
    // since the endpoint might not support the exact same format
    try {
      const result = await super.testConnection();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = CustomProvider;
