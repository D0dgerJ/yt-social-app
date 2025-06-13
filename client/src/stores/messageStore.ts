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
  clearMessages: () => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  messages: [],
  setMessages: (msgs) => set({ messages: msgs }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
}));
