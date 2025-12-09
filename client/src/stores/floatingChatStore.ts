import { create } from 'zustand';

interface FloatingChatState {
  isOpen: boolean;
  conversationId: number | null;

  x: number;
  y: number;
  minimized: boolean;

  open: (conversationId: number) => void;
  close: () => void;
  toggleMinimized: () => void;
  setPosition: (x: number, y: number) => void;
}

export const useFloatingChatStore = create<FloatingChatState>((set) => ({
  isOpen: false,
  conversationId: null,

  x: 40,
  y: 80,
  minimized: false,

  open: (conversationId) =>
    set({
      isOpen: true,
      minimized: false,
      conversationId,
    }),

  close: () =>
    set({
      isOpen: false,
      conversationId: null,
    }),

  toggleMinimized: () =>
    set((state) => ({
      minimized: !state.minimized,
    })),

  setPosition: (x, y) => set({ x, y }),
}));