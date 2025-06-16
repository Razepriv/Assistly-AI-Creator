
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

  // Punctuation Boundaries
  punctuationBoundaries: string[]; // e.g., ['.', '?', '!']
  customPunctuation: string[]; // User-defined punctuation for breaks
  pauseDurations: { // Pause length in ms
    comma: number;
    period: number;
    semicolon: number;
    // Potentially more custom punctuation pauses
  };
  smartChunking: boolean; // Toggle for intelligent sentence/phrase breaking

  // Emotion & Tone Settings
  emotion: string; // e.g., 'neutral', 'happy', 'sad', 'excited', provider-specific
  tone: string; // e.g., 'professional', 'casual', 'friendly', 'authoritative', provider-specific

  // Real-time Voice Processing & Effects
  voiceEffects: {
    echo: boolean; // 0-1 intensity or boolean
    reverb: boolean; // 0-1 intensity or boolean
    clarityEnhancement: boolean; // or specific algorithm
  };
  noiseReduction: boolean; // Toggle for background noise filtering
  audioQuality: { // Provider-specific options
    bitrate: number; // e.g., 128, 192, 256 kbps
    sampleRate: number; // e.g., 24000, 44100, 48000 Hz
  };
  providerSpecific?: { // For provider-specific settings not fitting general model
    elevenlabs?: {
      model_id?: string;
      stability?: number; // 0-1
      similarity_boost?: number; // 0-1
      style?: number; // 0-1 (for style_exaggeration)
      use_speaker_boost?: boolean;
    }
  }
}

export interface TranscriberConfig {
  provider: 'deepgram' | 'openai' | 'assemblyai' | 'mock-openai'; // Added mock-openai
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
  voice: VoiceConfig; // Made non-optional
  transcriber: TranscriberConfig; // Made non-optional
  // Placeholder for other tab settings
  toolsIntegrations?: Record<string, any>;
  analysisSettings?: Record<string, any>;
  systemPromptEnforcement?: {
    enabled: boolean;
    level?: string; // e.g. 'strict', 'moderate'
  };
  // For latency display, this would likely be dynamic data, not stored config
}

// Chat History Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string; // Unique ID for the chat session
  assistantId: string; // ID of the assistant this chat is with
  userId: string; // ID of the user (for demo purposes, could be a mock ID)
  startTime: string;
  messages: ChatMessage[];
}

// Test Assistant Chat Types
export interface TestChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
  isTranscribing?: boolean;
  isSynthesizing?: boolean;
  audioDataUri?: string; // To store user's recorded audio if needed for replay
}

export interface TestAssistantChatInput {
  userInput: string;
  assistantConfig: AssistantConfig; // Pass the whole config for simplicity
  chatHistory: TestChatMessage[];
}

export interface TestAssistantChatOutput {
  assistantResponse: string;
}

// Deepgram Server Action State
export interface DeepgramTranscriptionState {
  transcribedText?: string | null;
  error?: string | null;
  success: boolean;
}
