
import type { Assistant, AssistantConfig, VoiceConfig, TranscriberConfig } from '@/types';

export const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

export const ELEVENLABS_VOICES = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (F, American, Calm)' },
  { id: '29vD33N1CtxCmqQRPOHJ', name: 'Drew (M, American, Conversational)' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde (M, American, Deep)' },
  { id: '5Q0t7uMcjvnagumLfvZi', name: 'Paul (M, American, Authoritative)' },
  { id: '6JsmTroalVewG1gA6Jmw', name: 'Sia - Friendly Conversational Voice' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi (F, American, Strong)' },
  { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave (M, British, Conversational)' },
  { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin (M, British, Deep)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (F, American, Sweet)' },
  { id: 'ErXwobaYiN019P7OCKZ9', name: 'Antoni (M, American, Well-rounded)' },
  { id: 'GBv7mTt0atIp3Br8iCZE', name: 'Thomas (M, American, Calm)' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Charlie (M, Australian, Casual)' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'George (M, British, Raspy)' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Matthew (M, British, Full-bodied)' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy (F, British, Pleasant)' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Bella (F, American, Soft)' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold (M, American, Crisp)' },
  { id: 'VOYVp58_m8j7l6n9042i', name: 'Freya (F, American, Overhyped)'},
  { id: 'Yko7PKHZNXotIFUBG7I9', name: 'Grace (F, American, Soft)' },
  { id: 'ZQe5CZNOzWTMGPFeQj2S', name: 'Daniel (M, British, Deep)' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'James (M, British, Old)' },
  { id: 'bVMeCyTHy58xNoL34h3p', name: 'Gigi (F, American, Childlish)' },
  { id: 'g5CIjZEefAph4nQFvHAz', name: 'Liam (M, American, Neutral)' },
  { id: 'jBpfuIE2acCO8z3wKNLl', name: 'Nicole (F, American, Whispering)' },
  { id: 'jsCqWAovK2LkecY7zX02', name: 'Bill (M, American, Strong)' },
  { id: 'piTKgcLEGmPE4e6mEKli', name: 'Adam (M, American, Deep)' },
  { id: 'pqHkRDMhZ9xky8V6UeVD', name: 'Alice (F, British, Sweet)' },
  { id: 't0jbNlBVZ17f02VDIeMI', name: 'Jeremy (M, American, Raspy)' },
  { id: 'z9fAnxQcWzI9SwUxBBKk', name: 'Glinda (F, American, Soft)' },
  { id: 'zcAOhNBS3c14rBihAFp1', name: 'Joseph (M, British, Neutral)' },
  { id: 'zqn6B32R982AIa32P4zD', name: 'Serena (F, American, Pleasant)' },
  { id: 'pzxut4zZz4GImZNlqQ3H', name: 'Raju' },
];


export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  provider: 'elevenlabs',
  voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel's ID
  language: 'en-US', // This is often inferred by EL based on voiceId
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
  emotion: 'neutral', 
  tone: 'neutral', 
  voiceEffects: { echo: false, reverb: false, clarityEnhancement: true },
  noiseReduction: false,
  audioQuality: { bitrate: 128, sampleRate: 24000 },
  providerSpecific: {
    elevenlabs: {
      model_id: 'eleven_multilingual_v2', // Default EL model
      stability: 0.75,
      similarity_boost: 0.75,
    }
  }
};

export const TRANSCRIBER_PROVIDERS = [
    { id: 'deepgram', name: 'Deepgram' },
    { id: 'mock-openai', name: 'Mock OpenAI Whisper (Simulated)' },
    // { id: 'assemblyai', name: 'AssemblyAI' },
];

export const DEEPGRAM_MODELS = [
    { id: 'nova-2', name: 'Nova-2 (Latest, General)' },
    { id: 'nova-2-general', name: 'Nova-2 General' },
    { id: 'nova-2-meeting', name: 'Nova-2 Meeting Optimized' },
    { id: 'nova-2-phonecall', name: 'Nova-2 Phone Call Optimized' },
    { id: 'base', name: 'Base (Legacy)' },
];

export const MOCK_OPENAI_WHISPER_MODELS = [
    { id: 'whisper-1', name: 'Whisper v1 (Simulated)'},
    { id: 'whisper-large-v2', name: 'Whisper Large v2 (Simulated)'},
];

export const ALL_TRANSCRIBER_LANGUAGES = [
  { id: 'en-US', name: 'English (US)', providers: ['deepgram', 'mock-openai'] },
  { id: 'en-GB', name: 'English (UK)', providers: ['deepgram', 'mock-openai'] },
  { id: 'es', name: 'Español', providers: ['deepgram', 'mock-openai'] },
  { id: 'fr', name: 'Français', providers: ['deepgram', 'mock-openai'] },
  { id: 'de', name: 'Deutsch', providers: ['deepgram', 'mock-openai'] },
  { id: 'ja', name: '日本語 (Japanese)', providers: ['deepgram', 'mock-openai']},
  { id: 'auto', name: 'Auto-detect (Provider Specific)', providers: ['deepgram'] }, // Mock OpenAI might not have this
];


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
    customVocabulary: [], // Initialize customVocabulary
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
      voiceId: '2EiwWnXFnvU5JabPnv8n', // Clyde's ID
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
      voiceId: '6JsmTroalVewG1gA6Jmw', // Sia's ID
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
