import { create } from "zustand";

export interface FloatingWindow {
  id: string;
  conversationId: number;
  x: number;
  y: number;
  minimized: boolean;
}

interface FloatingChatState {
  windows: FloatingWindow[];

  open: (conversationId: number) => void;
  close: (id: string) => void;
  closeByConversation: (conversationId: number) => void;
  toggleMinimized: (id: string) => void;
  setPosition: (id: string, x: number, y: number) => void;
}

const MAX_WINDOWS = 10;

export const useFloatingChatStore = create<FloatingChatState>((set) => ({
  windows: [],

  open: (conversationId) =>
    set((state) => {
      const existing = state.windows.find(
        (w) => w.conversationId === conversationId
      );
      if (existing) {
        const rest = state.windows.filter((w) => w.id !== existing.id);
        return {
          windows: [...rest, { ...existing, minimized: false }],
        };
      }

      const baseWindows =
        state.windows.length >= MAX_WINDOWS
          ? state.windows.slice(1)
          : state.windows;

      const offset = baseWindows.length;
      const id = `${conversationId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      return {
        windows: [
          ...baseWindows,
          {
            id,
            conversationId,
            x: 40 + offset * 24,
            y: 80 + offset * 24,
            minimized: false,
          },
        ],
      };
    }),

  close: (id) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    })),

  closeByConversation: (conversationId) =>
    set((state) => ({
      windows: state.windows.filter((w) => w.conversationId !== conversationId),
    })),

  toggleMinimized: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized } : w
      ),
    })),

  setPosition: (id, x, y) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, x, y } : w
      ),
    })),
}));