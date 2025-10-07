import { create } from 'zustand';
import type { Message } from '@/stores/messageStore';

interface ComposerState {
  replyTarget?: Message;
  editing?: Message;
  setReplyTarget: (m?: Message) => void;
  beginEdit: (m: Message) => void;
  endEdit: () => void;
}

export const useComposerStore = create<ComposerState>((set) => ({
  replyTarget: undefined,
  editing: undefined,
  setReplyTarget: (m) => set({ replyTarget: m }),
  beginEdit: (m) => set({ editing: m }),
  endEdit: () => set({ editing: undefined }),
}));