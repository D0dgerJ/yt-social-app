import { create } from 'zustand';

export interface Message {
  id: number;
  conversationId: number;
  clientMessageId?: string;
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
  replaceMessage: (clientMessageId: string, newMsg: Message) => void;
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
      const exists = state.messages.some(
        (m) =>
          m.id === msg.id ||
          (msg.clientMessageId && m.clientMessageId === msg.clientMessageId)
      );

      if (exists) {
        console.warn('⚠️ Дубликат сообщения (не добавлено):', msg);
        return state;
      }

      return {
        messages: [...state.messages, msg].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      };
    }),

  updateMessage: (updatedMsg) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
      ),
    })),

  replaceMessage: (clientMessageId: string, newMsg: Message) =>
    set((state) => {
      const index = state.messages.findIndex(
        (msg) => msg.clientMessageId === clientMessageId
      );

      if (index === -1) {
        console.warn('⚠️ Сообщение с clientMessageId не найдено:', clientMessageId);
        return state;
      }

      const filtered = state.messages.filter(
        (msg, i) => i === index || msg.id !== newMsg.id
      );

      const newMessages = [...filtered];
      newMessages[index] = newMsg;

      return {
        messages: newMessages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
      };
    }),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  clearMessages: () => set({ messages: [] }),
}));
