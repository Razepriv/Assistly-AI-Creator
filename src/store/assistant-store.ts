import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Assistant } from '@/types';
import { INITIAL_ASSISTANTS } from '@/lib/constants';

interface AssistantState {
  assistants: Assistant[];
  activeAssistantId: string | null;
  searchQuery: string;
  addAssistant: (assistant: Omit<Assistant, 'id' | 'createdAt' | 'updatedAt'>) => Assistant;
  updateAssistant: (id: string, updates: Partial<Omit<Assistant, 'id' | 'createdAt'>>) => void;
  deleteAssistant: (id: string) => void;
  setActiveAssistantId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  getAssistantById: (id: string | null) => Assistant | undefined;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      assistants: INITIAL_ASSISTANTS,
      activeAssistantId: INITIAL_ASSISTANTS.length > 0 ? INITIAL_ASSISTANTS[0].id : null,
      searchQuery: '',
      addAssistant: (newAssistantData) => {
        const newId = `${newAssistantData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const now = new Date().toISOString();
        const assistant: Assistant = {
          id: newId,
          ...newAssistantData,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ assistants: [...state.assistants, assistant] }));
        return assistant;
      },
      updateAssistant: (id, updates) =>
        set((state) => ({
          assistants: state.assistants.map((assistant) =>
            assistant.id === id ? { ...assistant, ...updates, updatedAt: new Date().toISOString() } : assistant
          ),
        })),
      deleteAssistant: (id) =>
        set((state) => ({
          assistants: state.assistants.filter((assistant) => assistant.id !== id),
          activeAssistantId: state.activeAssistantId === id ? null : state.activeAssistantId,
        })),
      setActiveAssistantId: (id) => set({ activeAssistantId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      getAssistantById: (id) => get().assistants.find(assistant => assistant.id === id),
    }),
    {
      name: 'assistly-assistant-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const selectFilteredAssistants = (state: AssistantState): Assistant[] => {
  const { assistants, searchQuery } = state;
  if (!searchQuery) {
    return assistants;
  }
  return assistants.filter(
    (assistant) =>
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
};
