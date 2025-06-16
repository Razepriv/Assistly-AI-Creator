
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChatSession, ChatMessage } from '@/types';
import {nanoid} from 'nanoid'; // Small library for generating unique IDs

// Mock Data for initial state
const MOCK_CHAT_SESSIONS: ChatSession[] = [
  {
    id: nanoid(),
    assistantId: 'elliot-1', // Assuming 'elliot-1' is a valid assistant ID
    userId: 'user_123',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    messages: [
      { id: nanoid(), role: 'user', content: 'Hello, I need help with my order.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 10).toISOString() },
      { id: nanoid(), role: 'assistant', content: 'Certainly, I can help with that. What is your order number?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 20).toISOString() },
      { id: nanoid(), role: 'user', content: 'My order number is #12345.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 30).toISOString() },
    ],
  },
  {
    id: nanoid(),
    assistantId: 'elliot-1',
    userId: 'user_456',
    startTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    messages: [
      { id: nanoid(), role: 'user', content: 'What are your business hours?', timestamp: new Date(Date.now() - 1000 * 60 * 30 + 1000 * 5).toISOString() },
      { id: nanoid(), role: 'assistant', content: 'We are open from 9 AM to 5 PM, Monday to Friday.', timestamp: new Date(Date.now() - 1000 * 60 * 30 + 1000 * 15).toISOString() },
    ],
  },
  {
    id: nanoid(),
    assistantId: 'sarah-1', // Assuming 'sarah-1' is a valid assistant ID
    userId: 'user_789',
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    messages: [
      { id: nanoid(), role: 'user', content: 'Can you help me write a slogan for my new coffee shop?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 10).toISOString()},
      { id: nanoid(), role: 'assistant', content: 'Absolutely! Tell me a bit about your coffee shop\'s vibe.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 20).toISOString()},
    ],
  },
];


interface ChatState {
  sessions: ChatSession[];
  addSession: (assistantId: string, userId: string) => ChatSession;
  addMessageToSession: (sessionId: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  getSessionsByAssistantId: (assistantId: string) => ChatSession[];
  getSessionById: (sessionId: string) => ChatSession | undefined;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: MOCK_CHAT_SESSIONS, // Initialize with mock data
      addSession: (assistantId, userId) => {
        const newSession: ChatSession = {
          id: nanoid(),
          assistantId,
          userId,
          startTime: new Date().toISOString(),
          messages: [],
        };
        set((state) => ({ sessions: [...state.sessions, newSession] }));
        return newSession;
      },
      addMessageToSession: (sessionId, messageData) => {
        set((state) => ({
          sessions: state.sessions.map((session) => {
            if (session.id === sessionId) {
              const newMessage: ChatMessage = {
                ...messageData,
                id: nanoid(),
                timestamp: new Date().toISOString(),
              };
              return { ...session, messages: [...session.messages, newMessage] };
            }
            return session;
          }),
        }));
      },
      getSessionsByAssistantId: (assistantId) => {
        return get().sessions.filter((session) => session.assistantId === assistantId).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      },
      getSessionById: (sessionId) => {
        return get().sessions.find((session) => session.id === sessionId);
      },
    }),
    {
      name: 'assistly-chat-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If you want to ensure mock data is present on first load after rehydration and sessions are empty:
          // if (state.sessions.length === 0) {
          //   state.sessions = MOCK_CHAT_SESSIONS;
          // }
        }
      }
    }
  )
);
