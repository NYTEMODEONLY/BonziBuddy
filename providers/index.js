const XAIProvider = require('./xai-provider');
const AnthropicProvider = require('./anthropic-provider');
const OpenAIProvider = require('./openai-provider');
const CustomProvider = require('./custom-provider');

/**
 * Registry of available providers
 */
const PROVIDERS = {
  xai: XAIProvider,
  anthropic: AnthropicProvider,
  openai: OpenAIProvider,
  custom: CustomProvider
};

/**
 * Default provider configurations
 */
const DEFAULT_CONFIGS = {
  xai: {
    apiKey: '',
    model: 'grok-3-mini',
    baseUrl: 'https://api.x.ai/v1'
  },
  anthropic: {
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    baseUrl: 'https://api.anthropic.com'
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1'
  },
  custom: {
    apiKey: '',
    model: 'llama2',
    baseUrl: 'http://localhost:11434/v1'
  }
};

/**
 * Create a provider instance
 * @param {string} providerName - The provider ID (xai, anthropic, openai, custom)
 * @param {Object} config - Provider configuration {apiKey, model, baseUrl}
 * @returns {BaseProvider}
 */
function createProvider(providerName, config = {}) {
  const ProviderClass = PROVIDERS[providerName];
  if (!ProviderClass) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  return new ProviderClass(config);
}

/**
 * Get list of available providers with their info
 * @returns {Array<{id: string, name: string, requiresApiKey: boolean, models: Array}>}
 */
function getAvailableProviders() {
  return Object.keys(PROVIDERS).map(id => {
    const instance = new PROVIDERS[id]();
    return {
      id,
      name: instance.getProviderName(),
      requiresApiKey: instance.requiresApiKey(),
      models: instance.getAvailableModels()
    };
  });
}

/**
 * Get default configuration for a provider
 * @param {string} providerName - The provider ID
 * @returns {Object}
 */
function getDefaultConfig(providerName) {
  return DEFAULT_CONFIGS[providerName] || {};
}

/**
 * Get all default configurations
 * @returns {Object}
 */
function getAllDefaultConfigs() {
  return { ...DEFAULT_CONFIGS };
}

module.exports = {
  createProvider,
  getAvailableProviders,
  getDefaultConfig,
  getAllDefaultConfigs,
  PROVIDERS,
  DEFAULT_CONFIGS
};
