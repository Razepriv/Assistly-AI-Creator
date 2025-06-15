import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AssistantConfig } from '@/types';
import { DEFAULT_ASSISTANT_CONFIG, INITIAL_ASSISTANT_CONFIGS } from '@/lib/constants';

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
          return existingConfig;
        }
        // If no config exists, create a new one
        return get().createConfig(assistantId, assistantName);
      },
      
      updateConfig: (assistantId, updates) => {
        set((state) => {
          const currentConfig = state.configs[assistantId] || { id: assistantId, assistantName: updates.assistantName || 'Unknown Assistant', ...DEFAULT_ASSISTANT_CONFIG };
          return {
            configs: {
              ...state.configs,
              [assistantId]: { ...currentConfig, ...updates },
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
          return { configs: newConfigs };
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
      }
    }),
    {
      name: 'assistly-config-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ configs: state.configs }), // Only persist configs
    }
  )
);
