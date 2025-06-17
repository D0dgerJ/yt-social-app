import { create } from 'zustand';

interface Chat {
  id: number;
  name?: string;
  isGroup: boolean;
  participants: number[];
  lastMessage?: {
    id: number;
    content: string;
    createdAt: string;
    senderId: number;
  };
  updatedAt?: string;
  creatorId?: number;
}

interface ChatStore {
  conversations: Chat[];
  currentConversationId: number | null;
  setConversations: (chats: Chat[]) => void;
  setCurrentConversationId: (id: number | null) => void;
  updateChat: (chat: Chat) => void;
  removeChat: (id: number) => void;
  clearStore: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  currentConversationId: null,

  setConversations: (chats) => set({ conversations: chats }),

  setCurrentConversationId: (id) => set({ currentConversationId: id }),

  updateChat: (chat) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === chat.id ? { ...c, ...chat } : c
      ),
    })),

  removeChat: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
    })),

  clearStore: () => set({ conversations: [], currentConversationId: null }),
}));
