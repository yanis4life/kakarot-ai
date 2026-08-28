export const modelMap = {
  gpt54: {
    name: 'GPT 5.4',
    pref: 'gpt_5_4',
    prompt: 'You are a helpful AI assistant powered by GPT 5.4.',
    provider: 'openai',
    supports_thinking: false,
    coin_cost: 1
  },
  gpt55: {
    name: 'GPT 5.5',
    pref: 'gpt_5_5',
    prompt: 'You are a helpful AI assistant powered by GPT 5.5.',
    provider: 'openai',
    supports_thinking: false,
    coin_cost: 1
  },
  gpt56_sol: {
    name: 'GPT 5.6 Sol',
    pref: 'gpt_5_6_sol',
    prompt: 'You are a helpful AI assistant powered by GPT 5.6 Sol.',
    provider: 'openai',
    supports_thinking: true,
    coin_cost: 2
  },
  gpt56_sol_thinking: {
    name: 'GPT 5.6 Sol',
    pref: 'gpt_5_6_sol',
    prompt: 'You are a helpful AI assistant powered by GPT 5.6 Sol. You should think deeply and reason step by step.',
    provider: 'openai',
    supports_thinking: true,
    coin_cost: 2
  },
  gpt56_terra: {
    name: 'GPT 5.6 Terra',
    pref: 'gpt_5_6_terra',
    prompt: 'You are a helpful AI assistant powered by GPT 5.6 Terra.',
    provider: 'openai',
    supports_thinking: true,
    coin_cost: 2
  },
  gpt56_terra_thinking: {
    name: 'GPT 5.6 Terra',
    pref: 'gpt_5_6_terra',
    prompt: 'You are a helpful AI assistant powered by GPT 5.6 Terra. You should think deeply and reason step by step.',
    provider: 'openai',
    supports_thinking: true,
    coin_cost: 2
  },
  claude46sonnet: {
    name: 'Claude 4.6 Sonnet',
    pref: 'claude_4_6_sonnet',
    prompt: 'You are a helpful AI assistant powered by Claude 4.6 Sonnet.',
    provider: 'anthropic',
    supports_thinking: false,
    coin_cost: 1
  },
  claude47opus: {
    name: 'Claude 4.7 Opus',
    pref: 'claude_4_7_opus',
    prompt: 'You are a helpful AI assistant powered by Claude 4.7 Opus.',
    provider: 'anthropic',
    supports_thinking: false,
    coin_cost: 2
  },
  claude48opus: {
    name: 'Claude 4.8 Opus',
    pref: 'claude_4_8_opus',
    prompt: 'You are a helpful AI assistant powered by Claude 4.8 Opus.',
    provider: 'anthropic',
    supports_thinking: false,
    coin_cost: 2
  },
  claude50sonnet: {
    name: 'Claude 5.0 Sonnet',
    pref: 'claude_5_0_sonnet',
    prompt: 'You are a helpful AI assistant powered by Claude 5.0 Sonnet.',
    provider: 'anthropic',
    supports_thinking: true,
    coin_cost: 2
  },
  claude50sonnetthinking: {
    name: 'Claude 5.0 Sonnet',
    pref: 'claude_5_0_sonnet',
    prompt: 'You are a helpful AI assistant powered by Claude 5.0 Sonnet. You should think deeply and reason step by step.',
    provider: 'anthropic',
    supports_thinking: true,
    coin_cost: 2
  },
  claude50opus: {
    name: 'Claude 5.0 Opus',
    pref: 'claude_5_0_opus',
    prompt: 'You are a helpful AI assistant powered by Claude 5.0 Opus.',
    provider: 'anthropic',
    supports_thinking: false,
    coin_cost: 3
  },
  gemini3_1pro: {
    name: 'Gemini 3.1 Pro',
    pref: 'gemini_3_1_pro',
    prompt: 'You are a helpful AI assistant powered by Gemini 3.1 Pro.',
    provider: 'google',
    supports_thinking: false,
    coin_cost: 1
  },
  kimik26instant: {
    name: 'Kimi K2.6 Instant',
    pref: 'kimi_k2_6_instant',
    prompt: 'You are a helpful AI assistant powered by Kimi K2.6 Instant.',
    provider: 'moonshot',
    supports_thinking: false,
    coin_cost: 1
  },
  glm_5_2: {
    name: 'GLM 5.2',
    pref: 'glm_5_2',
    prompt: 'You are a helpful AI assistant powered by GLM 5.2.',
    provider: 'zhipu',
    supports_thinking: false,
    coin_cost: 1
  }
};

export const providerConfig = {
  openai: { name: 'OpenAI', logo: '/static/assets/provider/openai.png' },
  anthropic: { name: 'Anthropic', logo: '/static/assets/provider/anthropic.png' },
  google: { name: 'Google', logo: '/static/assets/provider/google.png' },
  moonshot: { name: 'Moonshot', logo: '/static/assets/provider/moonshot.png' },
  zhipu: { name: 'Zhipu', logo: '/static/assets/provider/zhipu.png' }
};

export const PPLX_API_URL = 'https://www.perplexity.ai/rest/sse/perplexity_ask';

export function getModelByKey(key) {
  return modelMap[key] || null;
}

export function getEnabledModels() {
  return Object.entries(modelMap).filter(([key]) => !key.endsWith('_thinking') && !key.endsWith('thinking')).map(([key, model]) => ({
    id: key,
    object: 'model',
    created: 1700000000,
    owned_by: model.provider,
    name: model.name,
    provider: model.provider,
    provider_logo: providerConfig[model.provider]?.logo || '',
    supports_thinking: model.supports_thinking,
    coin_cost: model.coin_cost
  }));
}