import { create } from 'zustand';

interface Chat {
  id: number;
  name?: string;
  isGroup: boolean;
  participants: number[];
}

interface ChatStore {
  conversations: Chat[];
  currentConversationId: number | null;
  setConversations: (chats: Chat[]) => void;
  setCurrentConversationId: (id: number | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  currentConversationId: null,
  setConversations: (chats) => set({ conversations: chats }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
}));
