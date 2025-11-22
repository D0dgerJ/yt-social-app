import { create } from 'zustand';

export type MediaType =
  | 'image'
  | 'video'
  | 'file'
  | 'gif'
  | 'audio'
  | 'text'
  | 'sticker'
  | null;

export interface Reaction {
  emoji: string;
  userId: number;
}

export type UserLite = {
  id: number;
  username?: string;
  profilePicture?: string | null;
};

export interface GroupedReaction {
  emoji: string;
  count: number;
  users: UserLite[];
}

export interface MediaFileLite {
  id: number;
  url: string;
  type: Exclude<MediaType, 'text' | 'sticker' | null>;
  uploadedAt: string; // ISO

  originalName?: string | null;
  mime?: string | null;
  size?: number | null;
}

export type RepliedToLite = {
  id: number;
  senderId: number;

  encryptedContent?: string | null;
  content?: string;

  mediaUrl?: string | null;
  mediaType?: MediaType;
  fileName?: string | null;

  isDeleted?: boolean;
  sender?: UserLite | null;
};

export interface Message {
  id: number;
  conversationId: number;
  clientMessageId?: string | null;
  senderId: number;

  content?: string;
  encryptedContent?: string | null;

  mediaUrl?: string | null;
  mediaType?: MediaType;
  fileName?: string | null;

  mediaFiles?: MediaFileLite[];

  gifUrl?: string | null;
  stickerUrl?: string | null;

  repliedToId?: number | null;
  repliedTo?: RepliedToLite | null;

  isDelivered: boolean;
  isRead: boolean;
  localStatus?: 'sending' | 'sent' | 'failed';

  createdAt: string;
  updatedAt?: string | null;
  editedAt?: string | null;
  deletedAt?: string | null;

  reactions?: Reaction[];
  groupedReactions?: GroupedReaction[];
  myReactions?: string[];

  sender?: UserLite | null;

  isPinned?: boolean;
  pinnedAt?: string | null;

  isEphemeral?: boolean;
  expiresAt?: string | null;
  maxViewsPerUser?: number | null;
  remainingViewsForMe?: number | null;
}

function mergePreserveDecrypted(
  prev: Message | undefined,
  nextPartial: Partial<Message>
): Message {
  const merged: Message = {
    ...(prev || ({} as Message)),
    ...nextPartial,
  };

  if (nextPartial.content && typeof nextPartial.content === 'string') {
    merged.content = nextPartial.content;
  } else if (prev?.content && !nextPartial.content) {
    merged.content = prev.content;
  }

  if (nextPartial.repliedTo || prev?.repliedTo) {
    const prevReply = prev?.repliedTo;
    const nextReply = nextPartial.repliedTo;

    if (nextReply || prevReply) {
      const mergedReply: RepliedToLite = {
        ...(prevReply || {}),
        ...(nextReply || {}),
      };

      if (nextReply?.content && typeof nextReply.content === 'string') {
        mergedReply.content = nextReply.content;
      } else if (prevReply?.content && !nextReply?.content) {
        mergedReply.content = prevReply.content;
      }

      merged.repliedTo = mergedReply;
    }
  }

  return merged;
}

const sortByCreatedAtAsc = (arr: Message[]) =>
  arr.sort((a, b) => {
    const ta = Date.parse(a.createdAt) || 0;
    const tb = Date.parse(b.createdAt) || 0;
    if (ta !== tb) return ta - tb;

    const aid = a.id ?? Number.MAX_SAFE_INTEGER;
    const bid = b.id ?? Number.MAX_SAFE_INTEGER;
    if (aid !== bid) return aid - bid;

    const ac = a.clientMessageId ?? '';
    const bc = b.clientMessageId ?? '';
    return ac.localeCompare(bc);
  });

const upsertWithDedupe = (list: Message[], incoming: Message): Message[] => {
  const byId =
    incoming.id != null ? list.findIndex((m) => m.id === incoming.id) : -1;
  const byClient =
    incoming.clientMessageId != null
      ? list.findIndex((m) => m.clientMessageId === incoming.clientMessageId)
      : -1;

  const idx = byId !== -1 ? byId : byClient;

  if (idx >= 0) {
    const next = [...list];

    const prevMsg = next[idx];
    const merged = mergePreserveDecrypted(prevMsg, {
      ...incoming,
      localStatus: incoming.localStatus ?? prevMsg.localStatus,
    });

    next[idx] = merged;
    return sortByCreatedAtAsc(next);
  }

  const mergedNew = mergePreserveDecrypted(undefined, incoming);
  return sortByCreatedAtAsc([...list, mergedNew]);
};

const mergeUnique = (a: Message[], b: Message[]): Message[] => {
  const out: Message[] = [];

  const pushMerged = (incoming: Message) => {
    const i = out.findIndex(
      (x) =>
        x.id === incoming.id ||
        (!!incoming.clientMessageId &&
          x.clientMessageId === incoming.clientMessageId)
    );

    if (i >= 0) {
      const prevMsg = out[i];
      out[i] = mergePreserveDecrypted(prevMsg, {
        ...incoming,
        localStatus: incoming.localStatus ?? prevMsg.localStatus,
      });
    } else {
      out.push(mergePreserveDecrypted(undefined, incoming));
    }
  };

  a.forEach(pushMerged);
  b.forEach(pushMerged);

  return sortByCreatedAtAsc(out);
};

type MessageMap = Record<number, Message[]>;

interface MessageState {
  byConv: MessageMap;

  activeConversationId: number | null;
  messages: Message[];

  handled: Set<string>;
  isHandled: (clientMessageId?: string | null) => boolean;
  markHandled: (clientMessageId?: string | null) => void;

  setActiveConversation: (conversationId: number | null) => void;

  setMessages: (msgs: Message[]) => void;

  addMessage: (msg: Message) => void;

  loadHistory: (
    conversationId: number,
    older: Message[],
    prepend?: boolean
  ) => void;

  replaceOptimistic: (clientId: string, serverMsg: Message) => void;

  markStatus: (
    conversationId: number,
    idOrClientId: number | string,
    patch: Partial<Pick<Message, 'isDelivered' | 'isRead' | 'localStatus'>>
  ) => void;

  updateMessage: (
    patch: Partial<Message> & {
      id?: number;
      clientMessageId?: string | null;
    }
  ) => void;

  removeMessage: (id: number) => void;

  clearMessages: () => void;

  updateMessageReactions: (
    conversationId: number,
    messageId: number,
    grouped: GroupedReaction[],
    meId?: number
  ) => void;

  toggleReaction: (
    conversationId: number,
    messageId: number,
    emoji: string,
    userId: number,
    toggledOn?: boolean
  ) => void;

  getById: (conversationId: number, id: number) => Message | undefined;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  byConv: {},
  activeConversationId: null,
  messages: [],

  handled: new Set<string>(),
  isHandled: (clientMessageId) => {
    if (!clientMessageId) return false;
    return get().handled.has(clientMessageId);
  },
  markHandled: (clientMessageId) => {
    if (!clientMessageId) return;
    set((state) => {
      const next = new Set(state.handled);
      next.add(clientMessageId);
      return { handled: next };
    });
  },

  setActiveConversation: (conversationId) =>
    set((state) => {
      if (conversationId == null) {
        return { activeConversationId: null, messages: [] };
      }
      const current = state.byConv[conversationId] ?? [];
      return { activeConversationId: conversationId, messages: [...current] };
    }),

  setMessages: (msgs) =>
    set((state) => {
      const convId = msgs[0]?.conversationId ?? state.activeConversationId;
      if (convId == null) {
        return { activeConversationId: null, messages: [] };
      }
      const prepared = msgs.map((m) =>
        mergePreserveDecrypted(undefined, m)
      );
      const sorted = sortByCreatedAtAsc(prepared);

      return {
        activeConversationId: convId,
        byConv: { ...state.byConv, [convId]: sorted },
        messages: sorted,
      };
    }),

  addMessage: (msg) =>
    set((state) => {
      const listForConv = state.byConv[msg.conversationId] ?? [];
      const updatedForConv = upsertWithDedupe(listForConv, msg);

      const shouldUpdateFlat =
        state.activeConversationId === msg.conversationId;

      return {
        byConv: {
          ...state.byConv,
          [msg.conversationId]: updatedForConv,
        },
        messages: shouldUpdateFlat
          ? [...updatedForConv]
          : state.messages,
      };
    }),

  loadHistory: (conversationId, older, prepend = true) =>
    set((state) => {
      const current = state.byConv[conversationId] ?? [];

      const merged = prepend
        ? mergeUnique(older, current)
        : mergeUnique(current, older);

      return {
        byConv: { ...state.byConv, [conversationId]: merged },
        messages:
          state.activeConversationId === conversationId
            ? [...merged]
            : state.messages,
      };
    }),

  replaceOptimistic: (clientId, serverMsg) =>
    set((state) => {
      const list = state.byConv[serverMsg.conversationId] ?? [];
      const idx = list.findIndex(
        (m) => m.clientMessageId === clientId
      );

      let nextList: Message[];

      if (idx >= 0) {
        const prevMsg = list[idx];
        const preservedClientId =
          prevMsg.clientMessageId ?? clientId;

        const merged = mergePreserveDecrypted(prevMsg, {
          ...serverMsg,
          clientMessageId: preservedClientId,
          localStatus: 'sent',
        });

        nextList = [...list];
        nextList[idx] = merged;
        nextList = sortByCreatedAtAsc(nextList);
      } else {
        nextList = upsertWithDedupe(list, {
          ...serverMsg,
          clientMessageId: clientId,
          localStatus: 'sent',
        } as Message);
      }

      return {
        byConv: {
          ...state.byConv,
          [serverMsg.conversationId]: nextList,
        },
        messages:
          state.activeConversationId === serverMsg.conversationId
            ? [...nextList]
            : state.messages,
      };
    }),

  markStatus: (conversationId, idOrClientId, patch) =>
    set((state) => {
      const list = state.byConv[conversationId] ?? [];
      const idx = list.findIndex((m) =>
        typeof idOrClientId === 'string'
          ? m.clientMessageId === idOrClientId
          : m.id === idOrClientId
      );
      if (idx < 0) return state;

      const prevMsg = list[idx];
      const merged = {
        ...prevMsg,
        ...patch,
      };

      const next = [...list];
      next[idx] = merged;

      return {
        byConv: { ...state.byConv, [conversationId]: next },
        messages:
          state.activeConversationId === conversationId
            ? [...next]
            : state.messages,
      };
    }),

  updateMessage: (patch) =>
    set((state) => {
      const convId: number | null =
        (patch as any).conversationId ??
        Object.keys(state.byConv)
          .map((k) => Number(k))
          .find((cid) =>
            state.byConv[cid]?.some(
              (m) =>
                (patch.id != null && m.id === patch.id) ||
                (!!patch.clientMessageId &&
                  m.clientMessageId === patch.clientMessageId)
            )
          ) ??
        state.activeConversationId;

      if (convId == null) return state;

      const list = state.byConv[convId] ?? [];
      const idx = list.findIndex(
        (m) =>
          (patch.id != null && m.id === patch.id) ||
          (!!patch.clientMessageId &&
            m.clientMessageId === patch.clientMessageId)
      );
      if (idx < 0) return state;

      const prevMsg = list[idx];
      const merged = mergePreserveDecrypted(prevMsg, patch);

      const next = [...list];
      next[idx] = merged;

      const sorted = sortByCreatedAtAsc(next);

      return {
        byConv: { ...state.byConv, [convId]: sorted },
        messages:
          state.activeConversationId === convId
            ? [...sorted]
            : state.messages,
      };
    }),

  removeMessage: (id) =>
    set((state) => {
      let foundConv: number | null = null;
      for (const [cidStr, arr] of Object.entries(state.byConv)) {
        if (arr.some((m) => m.id === id)) {
          foundConv = Number(cidStr);
          break;
        }
      }
      if (foundConv == null) return state;

      const nextList = (state.byConv[foundConv] ?? []).filter(
        (m) => m.id !== id
      );
      const nextByConv = {
        ...state.byConv,
        [foundConv]: nextList,
      };
      const nextFlat =
        state.activeConversationId === foundConv
          ? [...nextList]
          : state.messages;

      return { byConv: nextByConv, messages: nextFlat };
    }),

  clearMessages: () => set(() => ({ messages: [] })),

  updateMessageReactions: (
    conversationId,
    messageId,
    grouped,
    meId
  ) =>
    set((state) => {
      const list = state.byConv[conversationId] ?? [];
      const idx = list.findIndex((m) => m.id === messageId);
      if (idx < 0) return state;

      const oldMsg = list[idx];
      const msg: Message = {
        ...oldMsg,
        groupedReactions: Array.isArray(grouped)
          ? grouped.map((g) => ({
              emoji: g.emoji,
              count: Math.max(0, Number(g.count) || 0),
              users: Array.isArray(g.users) ? g.users : [],
            }))
          : [],
      };

      if (typeof meId === 'number') {
        msg.myReactions = msg.groupedReactions
          ?.filter((gr) =>
            gr.users?.some((u) => u.id === meId)
          )
          .map((gr) => gr.emoji);
      }

      const next = [...list];
      next[idx] = msg;

      return {
        byConv: { ...state.byConv, [conversationId]: next },
        messages:
          state.activeConversationId === conversationId
            ? [...next]
            : state.messages,
      };
    }),

  toggleReaction: (
    conversationId,
    messageId,
    emoji,
    userId,
    toggledOn
  ) =>
    set((state) => {
      const list = state.byConv[conversationId] ?? [];
      const idx = list.findIndex((m) => m.id === messageId);
      if (idx < 0) return state;

      const prevMsg = list[idx];
      const msg: Message = { ...prevMsg };

      const old = Array.isArray(msg.reactions)
        ? [...msg.reactions]
        : [];
      const oldIdx = old.findIndex(
        (r) => r.emoji === emoji && r.userId === userId
      );

      const shouldAddOld =
        typeof toggledOn === 'boolean'
          ? toggledOn
          : oldIdx < 0;

      if (shouldAddOld) {
        if (oldIdx < 0) old.push({ emoji, userId });
      } else if (oldIdx >= 0) {
        old.splice(oldIdx, 1);
      }
      msg.reactions = old;

      const grouped = Array.isArray(msg.groupedReactions)
        ? [...msg.groupedReactions]
        : [];
      const gi = grouped.findIndex(
        (g) => g.emoji === emoji
      );

      const ensureUser = (arr: UserLite[]) =>
        arr.some((u) => u.id === userId)
          ? arr
          : [...arr, { id: userId }];

      const existsUser =
        gi >= 0 &&
        grouped[gi].users?.some((u) => u.id === userId);

      const shouldAdd =
        typeof toggledOn === 'boolean'
          ? toggledOn
          : !existsUser;

      if (gi === -1) {
        if (shouldAdd)
          grouped.push({
            emoji,
            count: 1,
            users: [{ id: userId }],
          });
      } else {
        const g = { ...grouped[gi] };
        const users = Array.isArray(g.users)
          ? [...g.users]
          : [];

        if (shouldAdd) {
          g.users = ensureUser(users);
          g.count = Math.max(
            1,
            (g.count || 0) + (existsUser ? 0 : 1)
          );
        } else {
          g.users = users.filter(
            (u) => u.id !== userId
          );
          g.count = Math.max(
            0,
            (g.count || 0) - (existsUser ? 1 : 0)
          );
        }

        if (g.count === 0) {
          grouped.splice(gi, 1);
        } else {
          grouped[gi] = g;
        }
      }

      msg.groupedReactions = grouped;

      const next = [...list];
      next[idx] = msg;

      return {
        byConv: { ...state.byConv, [conversationId]: next },
        messages:
          state.activeConversationId === conversationId
            ? [...next]
            : state.messages,
      };
    }),

  getById: (conversationId, id) => {
    const list = get().byConv[conversationId] ?? [];
    return list.find((m) => m.id === id);
  },
}));
