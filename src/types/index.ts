export interface VoiceConfig {
  service: string; // e.g., 'elevenlabs', 'playht'
  voiceId: string;
  // other voice-specific settings
}

export interface TranscriberConfig {
  provider: string; // e.g., 'deepgram', 'assemblyai'
  model: string;
  language: string;
  // other transcriber-specific settings
}

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  category?: string; // e.g., "Elliot", "Sarah" - for future grouping
  createdAt: string;
  updatedAt: string;
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
  files: { name: string; type: string; size: number }[]; // Store file metadata, actual files handled separately
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
