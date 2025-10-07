import { create } from 'zustand';

export type UserTyping = {
  userId: number;
  username?: string;
  displayName?: string;
  lastAt: number;
};

interface TypingState {
  byConv: Record<number, Record<number, UserTyping>>;

  setTyping: (convId: number, entry: UserTyping) => void;
  stopTyping: (convId: number, userId: number) => void;
  getTypingList: (convId: number) => UserTyping[];
  purgeOlderThan: (convId: number, ttlMs?: number) => void;
  clear: (convId?: number) => void;
}

export const useTypingStore = create<TypingState>()((set, get) => ({
  byConv: {},

  setTyping: (convId, entry) => {
    const s = get();
    const conv = s.byConv[convId] ?? {};
    const prev = conv[entry.userId];

    if (!prev) {
      set({
        byConv: {
          ...s.byConv,
          [convId]: { ...conv, [entry.userId]: entry },
        },
      });
      return;
    }

    const sameMeta =
      prev.username === entry.username && prev.displayName === entry.displayName;
    if (entry.lastAt <= prev.lastAt && sameMeta) return;

    set({
      byConv: {
        ...s.byConv,
        [convId]: {
          ...conv,
          [entry.userId]: {
            ...prev,
            ...entry,
            lastAt: Math.max(prev.lastAt, entry.lastAt),
          },
        },
      },
    });
  },

  stopTyping: (convId, userId) => {
    const s = get();
    const conv = s.byConv[convId];
    if (!conv || !(userId in conv)) return;

    const nextConv = { ...conv };
    delete nextConv[userId];

    if (Object.keys(nextConv).length === 0) {
      const { [convId]: _drop, ...rest } = s.byConv;
      set({ byConv: rest });
    } else {
      set({ byConv: { ...s.byConv, [convId]: nextConv } });
    }
  },

  getTypingList: (convId) => {
    const conv = get().byConv[convId];
    if (!conv) return [];
    return Object.values(conv).sort((a, b) => a.userId - b.userId);
  },

  purgeOlderThan: (convId, ttlMs = 4000) => {
    const s = get();
    const conv = s.byConv[convId];
    if (!conv) return;

    const now = Date.now();
    let changed = false;
    const nextConv: Record<number, UserTyping> = {};

    for (const [k, v] of Object.entries(conv)) {
      if (now - v.lastAt < ttlMs) nextConv[Number(k)] = v;
      else changed = true;
    }

    if (!changed) return;

    if (Object.keys(nextConv).length === 0) {
      const { [convId]: _drop, ...rest } = s.byConv;
      set({ byConv: rest });
    } else {
      set({ byConv: { ...s.byConv, [convId]: nextConv } });
    }
  },

  clear: (convId) => {
    const s = get();
    if (convId == null) {
      set({ byConv: {} });
      return;
    }
    if (!(convId in s.byConv)) return;
    const next = { ...s.byConv };
    delete next[convId];
    set({ byConv: next });
  },
}));
