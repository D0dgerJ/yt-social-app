import { create } from 'zustand';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker';
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;
  isDelivered: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  repliedTo?: Message;
}

interface MessageStore {
  messages: Message[];
  setMessages: (msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateMessage: (updatedMsg: Message) => void;
  replaceMessage: (oldId: number, newMsg: Message) => void;
  removeMessage: (id: number) => void;
  clearMessages: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],

  setMessages: (msgs) =>
    set((state) => {
      const unique = msgs.filter(
        (newMsg) => !state.messages.some((msg) => msg.id === newMsg.id)
      );
      const all = [...state.messages, ...unique];
      return {
        messages: all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      };
    }),

  addMessage: (msg) =>
    set((state) => {
      const exists = state.messages.some((m) => m.id === msg.id);
      // Если id меньше 0 или начинается с "temp-", это временное
      if (exists) {
        console.warn('⚠️ Дубликат сообщения (не добавлено):', msg);
        return state;
      }

      return { messages: [...state.messages, msg] };
    }),

  updateMessage: (updatedMsg) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
      ),
    })),

  replaceMessage: (oldId, newMsg) =>
    set((state) => {
      const alreadyExists = state.messages.some((msg) => msg.id === newMsg.id);
      if (alreadyExists) {
        console.warn("⚠️ Сообщение уже есть:", newMsg.id);
        return state;
      }

      return {
        messages: state.messages.map((msg) =>
          msg.id === oldId ? newMsg : msg
        ),
      };
    }),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  clearMessages: () => set({ messages: [] }),
}));
