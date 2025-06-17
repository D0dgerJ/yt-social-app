import { create } from 'zustand';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content?: string;
  mediaUrl?: string;
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
  removeMessage: (id: number) => void;
  clearMessages: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],

  setMessages: (msgs) => set({ messages: msgs }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  updateMessage: (updatedMsg) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
      ),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  clearMessages: () => set({ messages: [] }),
}));
