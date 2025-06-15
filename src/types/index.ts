
export interface VoiceConfig {
  provider: string; // e.g., 'elevenlabs', 'google', 'aws'
  voiceId: string; // Specific voice ID from the provider
  language: string; // e.g., 'en-US'

  // Background Sound
  backgroundSound: 'default' | 'office' | 'cafe' | 'nature' | 'white_noise_brown' | 'white_noise_pink' | 'custom';
  backgroundSoundUrl?: string;
  backgroundVolume: number; // 0-1 (represents 0-100%)
  loopBackgroundSound: boolean;

  // Speech Parameters
  inputMinCharacters: number; // Default to 0 or a small number like 10
  speakingRate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0 (often represents a factor)
  masterVolume: number; // 0-1 (represents 0-100%)

  // Punctuation Boundaries (Placeholders for now)
  punctuationBoundaries?: string[];
  customPunctuation?: string[];
  pauseDurations?: {
    comma?: number;
    period?: number;
    semicolon?: number;
  };
  smartChunking?: boolean;

  // Emotion & Tone (Placeholders for now)
  emotion?: string;
  tone?: string;

  // Real-time Voice Processing (Placeholders for now)
  voiceEffects?: {
    echo?: boolean;
    reverb?: boolean;
    clarityEnhancement?: boolean;
  };
  noiseReduction?: boolean;
  audioQuality?: {
    bitrate?: number;
    sampleRate?: number;
  };
}

export interface TranscriberConfig {
  provider: 'deepgram' | 'openai' | 'assemblyai'; // Example providers
  model: string; // e.g., 'nova-2', 'whisper-1'
  language: string; // e.g., 'en-US', 'auto'
  autoDetectLanguage: boolean;
  smartFormatting: {
    enabled: boolean;
    punctuation: boolean;
    capitalization: boolean;
    speakerLabels: boolean;
    fillerWordRemoval: boolean;
    profanityFilter: boolean;
  };
  audioProcessing: {
    backgroundDenoising: boolean;
    denoisingIntensity: 'light' | 'medium' | 'strong';
    volumeNormalization: boolean;
    echoCancellation: boolean;
  };
  qualityControl: {
    confidenceThreshold: number; // 0.0 - 1.0
    minWordLength: number;
    customVocabulary: string[]; // Array of custom words/phrases
    filterLowConfidence: boolean;
  };
}


export interface Assistant {
  id: string;
  name: string;
  description?: string;
  category?: string; // e.g., "Elliot", "Sarah" - for future grouping
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  name: string;
  type: string;
  size: number;
  dataUri?: string; // To store file content as a data URI
}

export interface AssistantConfig {
  id: string; // Should match Assistant's id
  assistantName: string; // Storing name here too for convenience in config forms
  provider: 'openai'; // For now, only OpenAI
  model: string; // e.g., 'gpt-4', 'gpt-3.5-turbo'
  firstMessage: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number; // 0.0 - 1.0
  files: FileMetadata[]; // Store file metadata, actual files handled separately
  voice?: VoiceConfig;
  transcriber?: TranscriberConfig;
  // Placeholder for other tab settings
  toolsIntegrations?: Record<string, any>;
  analysisSettings?: Record<string, any>;
  systemPromptEnforcement?: {
    enabled: boolean;
    level?: string; // e.g. 'strict', 'moderate'
  };
  // For latency display, this would likely be dynamic data, not stored config
}
