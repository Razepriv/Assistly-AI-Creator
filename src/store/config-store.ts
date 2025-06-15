
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssistantConfig } from '@/types';
import { DEFAULT_ASSISTANT_CONFIG, INITIAL_ASSISTANT_CONFIGS, DEFAULT_VOICE_CONFIG, DEFAULT_TRANSCRIBER_CONFIG } from '@/lib/constants';

interface ConfigState {
  configs: Record<string, AssistantConfig>;
  isLoading: boolean;
  error: string | null;
  
  loadConfig: (assistantId: string, assistantName: string) => AssistantConfig;
  updateConfig: (assistantId: string, updates: Partial<AssistantConfig>) => void;
  getConfig: (assistantId: string) => AssistantConfig | undefined;
  deleteConfig: (assistantId: string) => void;
  createConfig: (assistantId: string, assistantName: string) => AssistantConfig;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      configs: INITIAL_ASSISTANT_CONFIGS,
      isLoading: false,
      error: null,

      loadConfig: (assistantId, assistantName) => {
        const existingConfig = get().configs[assistantId];
        if (existingConfig) {
          // Ensure existing configs have default voice and transcriber if they are missing
          return {
            ...existingConfig,
            voice: existingConfig.voice || DEFAULT_VOICE_CONFIG,
            transcriber: existingConfig.transcriber || DEFAULT_TRANSCRIBER_CONFIG,
          };
        }
        // If no config exists, create a new one
        return get().createConfig(assistantId, assistantName);
      },
      
      updateConfig: (assistantId, updates) => {
        set((state) => {
          const currentConfig = state.configs[assistantId] || { 
            id: assistantId, 
            assistantName: updates.assistantName || 'Unknown Assistant', 
            ...DEFAULT_ASSISTANT_CONFIG 
          };
          // Ensure voice and transcriber objects are merged correctly if partial updates are provided
          const newVoice = updates.voice ? { ...(currentConfig.voice || DEFAULT_VOICE_CONFIG), ...updates.voice } : (currentConfig.voice || DEFAULT_VOICE_CONFIG);
          const newTranscriber = updates.transcriber ? { ...(currentConfig.transcriber || DEFAULT_TRANSCRIBER_CONFIG), ...updates.transcriber } : (currentConfig.transcriber || DEFAULT_TRANSCRIBER_CONFIG);
          
          return {
            configs: {
              ...state.configs,
              [assistantId]: { 
                ...currentConfig, 
                ...updates,
                voice: newVoice,
                transcriber: newTranscriber,
              },
            },
            isLoading: false,
            error: null,
          };
        });
      },

      getConfig: (assistantId: string) => {
        const config = get().configs[assistantId];
        if (config) {
          return {
            ...config,
            voice: config.voice || DEFAULT_VOICE_CONFIG,
            transcriber: config.transcriber || DEFAULT_TRANSCRIBER_CONFIG,
          };
        }
        return undefined;
      },

      deleteConfig: (assistantId: string) => {
        set(state => {
          const newConfigs = { ...state.configs };
          delete newConfigs[assistantId];
          return { configs: newConfigs };
        });
      },

      createConfig: (assistantId: string, assistantName: string) => {
        const newConfig: AssistantConfig = {
          id: assistantId,
          assistantName: assistantName,
          ...DEFAULT_ASSISTANT_CONFIG, // This now includes default voice and transcriber
        };
        set(state => ({
          configs: {
            ...state.configs,
            [assistantId]: newConfig,
          }
        }));
        return newConfig;
      }
    }),
    {
      name: 'assistly-config-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ configs: state.configs }), // Only persist configs
      // Custom migration/versioning could be added here if schema changes significantly
      // version: 1, // example
      // migrate: (persistedState, version) => { ... }
    }
  )
);
