
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssistantConfig } from '@/types';
import { DEFAULT_ASSISTANT_CONFIG, INITIAL_ASSISTANT_CONFIGS, DEFAULT_VOICE_CONFIG, DEFAULT_TRANSCRIBER_CONFIG } from '@/lib/constants';

interface ConfigState {
  configs: Record<string, AssistantConfig>;
  isLoading: boolean;
  error: string | null;
  runtimeLatencies: Record<string, number | null>; // New: For real-time latency display
  
  loadConfig: (assistantId: string, assistantName: string) => AssistantConfig;
  updateConfig: (assistantId: string, updates: Partial<AssistantConfig>) => void;
  getConfig: (assistantId: string) => AssistantConfig | undefined;
  deleteConfig: (assistantId: string) => void;
  createConfig: (assistantId: string, assistantName: string) => AssistantConfig;
  setAssistantLatency: (assistantId: string, latency: number | null) => void; // New action
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      configs: INITIAL_ASSISTANT_CONFIGS,
      isLoading: false,
      error: null,
      runtimeLatencies: {}, // Initial empty object for latencies

      loadConfig: (assistantId, assistantName) => {
        let config = get().configs[assistantId];
        let needsUpdateInStore = false;

        if (config) {
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
          config = get().createConfig(assistantId, assistantName);
        }
        
        if (needsUpdateInStore && config) {
          const newConfigToStore = config; 
          set(state => ({
            configs: {
              ...state.configs,
              [assistantId]: newConfigToStore,
            }
          }));
        }
        return config!; 
      },
      
      updateConfig: (assistantId, updates) => {
        set((state) => {
          const currentConfig = state.configs[assistantId] || { 
            id: assistantId, 
            assistantName: updates.assistantName || 'Unknown Assistant', 
            ...DEFAULT_ASSISTANT_CONFIG 
          };
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
        return get().configs[assistantId];
      },

      deleteConfig: (assistantId: string) => {
        set(state => {
          const newConfigs = { ...state.configs };
          delete newConfigs[assistantId];
          const newRuntimeLatencies = { ...state.runtimeLatencies };
          delete newRuntimeLatencies[assistantId];
          return { configs: newConfigs, runtimeLatencies: newRuntimeLatencies };
        });
      },

      createConfig: (assistantId: string, assistantName: string) => {
        const newConfig: AssistantConfig = {
          id: assistantId,
          assistantName: assistantName,
          ...DEFAULT_ASSISTANT_CONFIG, 
        };
        set(state => ({
          configs: {
            ...state.configs,
            [assistantId]: newConfig,
          }
        }));
        return newConfig;
      },

      setAssistantLatency: (assistantId: string, latency: number | null) => {
        set(state => ({
          runtimeLatencies: {
            ...state.runtimeLatencies,
            [assistantId]: latency,
          }
        }));
      }
    }),
    {
      name: 'assistly-config-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist 'configs'. 'runtimeLatencies' will be transient.
      partialize: (state) => ({ configs: state.configs }), 
    }
  )
);
