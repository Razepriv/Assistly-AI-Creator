
import type { Assistant, AssistantConfig, VoiceConfig, TranscriberConfig } from '@/types';

export const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  provider: 'elevenlabs',
  voiceId: 'bella', 
  language: 'en-US',
  backgroundSound: 'default',
  backgroundSoundUrl: '',
  backgroundVolume: 0.5, 
  loopBackgroundSound: false,
  inputMinCharacters: 20,
  speakingRate: 1.0,
  pitch: 1.0,
  masterVolume: 1.0, 
  punctuationBoundaries: ['.', '?', '!'],
  customPunctuation: [],
  pauseDurations: { comma: 150, period: 300, semicolon: 250 },
  smartChunking: true,
  emotion: 'neutral', // Default emotion
  tone: 'neutral', // Default tone
  voiceEffects: { echo: false, reverb: false, clarityEnhancement: true },
  noiseReduction: false,
  audioQuality: { bitrate: 128, sampleRate: 24000 },
};

export const DEFAULT_TRANSCRIBER_CONFIG: TranscriberConfig = {
  provider: 'deepgram',
  model: 'nova-2', 
  language: 'en-US',
  autoDetectLanguage: false,
  smartFormatting: {
    enabled: true,
    punctuation: true,
    capitalization: true,
    speakerLabels: false, 
    fillerWordRemoval: false,
    profanityFilter: false,
  },
  audioProcessing: {
    backgroundDenoising: false,
    denoisingIntensity: 'medium',
    volumeNormalization: false,
    echoCancellation: false,
  },
  qualityControl: {
    confidenceThreshold: 0.85, 
    minWordLength: 0, 
    customVocabulary: [],
    filterLowConfidence: false,
  },
};

export const DEFAULT_ASSISTANT_CONFIG: Omit<AssistantConfig, 'id' | 'assistantName'> = {
  provider: 'openai',
  model: OPENAI_MODELS[0].id,
  firstMessage: 'Hello! How can I assist you today?',
  systemPrompt: 'You are a helpful AI assistant.',
  maxTokens: 2048,
  temperature: 0.7,
  files: [],
  systemPromptEnforcement: { enabled: false },
  voice: DEFAULT_VOICE_CONFIG,
  transcriber: DEFAULT_TRANSCRIBER_CONFIG,
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
    provider: 'openai',
    model: OPENAI_MODELS[0].id,
    firstMessage: 'Hello! How can I assist Elliot today?',
    systemPrompt: 'You are Elliot, a friendly and efficient customer support AI. Your goal is to resolve customer issues quickly and accurately.',
    maxTokens: 2048,
    temperature: 0.7,
    files: [],
    systemPromptEnforcement: { enabled: false },
    voice: {
      ...DEFAULT_VOICE_CONFIG,
      voiceId: 'adam', 
      emotion: 'friendly',
      tone: 'professional',
    },
    transcriber: {
        ...DEFAULT_TRANSCRIBER_CONFIG,
        model: 'nova-2-general', 
    }
  },
  'sarah-1': {
    id: 'sarah-1',
    assistantName: 'Sarah - Marketing Copywriter',
    provider: 'openai',
    model: 'gpt-4',
    firstMessage: 'Hi there! Ready to create some amazing marketing copy?',
    systemPrompt: 'You are Sarah, a creative marketing copywriter. Your specialty is crafting compelling and engaging content for various platforms.',
    maxTokens: 3000,
    temperature: 0.8,
    files: [],
    systemPromptEnforcement: { enabled: false },
    voice: {
      ...DEFAULT_VOICE_CONFIG,
      voiceId: 'rachel',
      speakingRate: 1.1, 
      pitch: 1.05, 
      emotion: 'excited',
      tone: 'creative',
    },
    transcriber: {
        ...DEFAULT_TRANSCRIBER_CONFIG,
        smartFormatting: {
            ...DEFAULT_TRANSCRIBER_CONFIG.smartFormatting,
            speakerLabels: true,
        }
    }
  },
};
