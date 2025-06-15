import type { Assistant, AssistantConfig } from '@/types';

export const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

export const DEFAULT_ASSISTANT_CONFIG: Omit<AssistantConfig, 'id' | 'assistantName'> = {
  provider: 'openai',
  model: OPENAI_MODELS[0].id,
  firstMessage: 'Hello! How can I assist you today?',
  systemPrompt: 'You are a helpful AI assistant.',
  maxTokens: 2048,
  temperature: 0.7,
  files: [],
  systemPromptEnforcement: { enabled: false },
};

export const INITIAL_ASSISTANTS: Assistant[] = [
  {
    id: 'elliot-1',
    name: 'Elliot - Customer Support',
    description: 'Handles customer inquiries and support tickets.',
    category: 'Elliot',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sarah-1',
    name: 'Sarah - Marketing Copywriter',
    description: 'Generates creative marketing copy.',
    category: 'Sarah',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_ASSISTANT_CONFIGS: Record<string, AssistantConfig> = {
  'elliot-1': {
    id: 'elliot-1',
    assistantName: 'Elliot - Customer Support',
    ...DEFAULT_ASSISTANT_CONFIG,
    systemPrompt: 'You are Elliot, a friendly and efficient customer support AI. Your goal is to resolve customer issues quickly and accurately.',
  },
  'sarah-1': {
    id: 'sarah-1',
    assistantName: 'Sarah - Marketing Copywriter',
    ...DEFAULT_ASSISTANT_CONFIG,
    model: 'gpt-4',
    systemPrompt: 'You are Sarah, a creative marketing copywriter. Your specialty is crafting compelling and engaging content for various platforms.',
    temperature: 0.8,
  },
};
