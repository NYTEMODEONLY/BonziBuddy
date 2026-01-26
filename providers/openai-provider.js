const BaseProvider = require('./base-provider');

/**
 * OpenAI (ChatGPT) provider implementation
 */
class OpenAIProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.model = config.model || 'gpt-4o-mini';
  }

  getProviderName() {
    return 'OpenAI (ChatGPT)';
  }

  getProviderId() {
    return 'openai';
  }

  getAvailableModels() {
    return [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ];
  }

  formatMessages(conversationHistory, systemPrompt) {
    // OpenAI uses system message in messages array
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

module.exports = OpenAIProvider;
