const BaseProvider = require('./base-provider');

/**
 * Anthropic (Claude) provider implementation
 */
class AnthropicProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com';
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  getProviderName() {
    return 'Anthropic (Claude)';
  }

  getProviderId() {
    return 'anthropic';
  }

  getAvailableModels() {
    return [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
    ];
  }

  formatMessages(conversationHistory, systemPrompt) {
    // Anthropic uses a different format: system is a top-level param, not in messages
    // Messages should only contain user and assistant roles
    return {
      system: systemPrompt,
      messages: conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    };
  }

  getEndpoint() {
    return `${this.baseUrl}/v1/messages`;
  }

  buildRequestBody(formattedMessages, maxTokens) {
    return {
      model: this.model,
      max_tokens: maxTokens,
      system: formattedMessages.system,
      messages: formattedMessages.messages
    };
  }

  extractResponse(responseData) {
    // Anthropic returns response in content[0].text
    return responseData.content[0].text;
  }

  extractErrorMessage(errorData, status) {
    // Anthropic has a different error format
    return errorData.error?.message ||
           errorData.message ||
           `API request failed with status ${status}`;
  }
}

module.exports = AnthropicProvider;
