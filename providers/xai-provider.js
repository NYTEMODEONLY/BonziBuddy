const BaseProvider = require('./base-provider');

/**
 * xAI (Grok) provider implementation
 */
class XAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.x.ai/v1';
    this.model = config.model || 'grok-3-mini';
  }

  getProviderName() {
    return 'xAI (Grok)';
  }

  getProviderId() {
    return 'xai';
  }

  getAvailableModels() {
    return [
      { id: 'grok-3-mini', name: 'Grok 3 Mini' },
      { id: 'grok-3', name: 'Grok 3' },
      { id: 'grok-2', name: 'Grok 2' },
      { id: 'grok-2-mini', name: 'Grok 2 Mini' }
    ];
  }

  formatMessages(conversationHistory, systemPrompt) {
    // xAI uses OpenAI-compatible format with system message in messages array
    return [
      { role: 'system', content: systemPrompt },
      ...conversationHistory
    ];
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  getEndpoint() {
    return `${this.baseUrl}/chat/completions`;
  }

  buildRequestBody(formattedMessages, maxTokens) {
    return {
      model: this.model,
      max_tokens: maxTokens,
      messages: formattedMessages
    };
  }

  extractResponse(responseData) {
    return responseData.choices[0].message.content;
  }
}

module.exports = XAIProvider;
