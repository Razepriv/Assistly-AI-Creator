
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
        let config = get().configs[assistantId];
        let needsUpdateInStore = false;

        if (config) {
          // Ensure existing configs have default voice and transcriber if they are missing
          const MappedVoiceConfig = config.voice || DEFAULT_VOICE_CONFIG;
          const MappedTranscriberConfig = config.transcriber || DEFAULT_TRANSCRIBER_CONFIG;

          if (config.voice !== MappedVoiceConfig || config.transcriber !== MappedTranscriberConfig) {
            config = { 
              ...config, 
              voice: MappedVoiceConfig, 
              transcriber: MappedTranscriberConfig 
            };
            needsUpdateInStore = true;
          }
        } else {
          // If no config exists, create a new one (createConfig saves to store)
          config = get().createConfig(assistantId, assistantName);
          // No need for needsUpdateInStore = true here as createConfig handles it.
        }
        
        if (needsUpdateInStore && config) {
          const newConfigToStore = config; // Capture current value for closure
          set(state => ({
            configs: {
              ...state.configs,
              [assistantId]: newConfigToStore,
            }
          }));
        }
        return config!; // Config is guaranteed to be defined here
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
        // Now that loadConfig and createConfig ensure defaults are in the store,
        // getConfig can simply return the stored object.
        return get().configs[assistantId];
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
      partialize: (state) => ({ configs: state.configs }), 
    }
  )
);
