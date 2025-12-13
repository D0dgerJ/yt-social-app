import { create } from "zustand";

interface Chat {
  id: number;
  name?: string;
  isGroup: boolean;
  participants: any[];
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

  getConversation: (id: number) => Chat | undefined;
  resolveName: (convId: number, userId: number) => string | undefined;
}

export const useChatStore = create<ChatStore>()((set, get) => ({
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

  clearStore: () =>
    set({
      conversations: [],
      currentConversationId: null,
    }),

  getConversation: (id) =>
    get().conversations.find((c) => c.id === id),

  resolveName: (convId, userId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    if (!conv || !Array.isArray(conv.participants)) return undefined;

    const p = conv.participants.find((p: any) => {
      const pid = p?.user?.id ?? p?.id;
      return pid === userId;
    });

    return (
      p?.user?.displayName ??
      p?.displayName ??
      p?.user?.username ??
      p?.username ??
      undefined
    );
  },
}));