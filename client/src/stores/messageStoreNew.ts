import { create } from 'zustand';

export type MediaType =
  | 'image'
  | 'video'
  | 'file'
  | 'gif'
  | 'audio'
  | 'text'
  | 'sticker';

export interface Message {
  id: number;                  
  conversationId: number;
  clientMessageId?: string;       
  senderId: number;

  content?: string;  
  encryptedContent?: string; 
  mediaUrl?: string | null;
  mediaType?: MediaType;
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;

  isDelivered: boolean;
  isRead: boolean;
  localStatus?: 'sending' | 'sent' | 'failed';

  createdAt: string;             
  updatedAt?: string;             
}

type MessageMap = Record<number, Message[]>;

interface MessageState {
  byConv: MessageMap;

  activeConversationId: number | null;

  messages: Message[];

  setActiveConversation: (conversationId: number | null) => void;

  setMessages: (msgs: Message[]) => void;

  addMessage: (msg: Message) => void;

  loadHistory: (conversationId: number, older: Message[], prepend?: boolean) => void;

  replaceOptimistic: (clientId: string, serverMsg: Message) => void;

  markStatus: (
    conversationId: number,
    idOrClientId: number | string,
    patch: Partial<Pick<Message, 'isDelivered' | 'isRead' | 'localStatus'>>
  ) => void;

  updateMessage: (patch: Partial<Message> & { id: number }) => void;

  removeMessage: (id: number) => void;

  clearMessages: () => void;
}

const sortByCreatedAtAsc = (arr: Message[]) =>
  arr.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

const upsertWithDedupe = (list: Message[], incoming: Message): Message[] => {
  const idx = list.findIndex(
    (m) =>
      (incoming.clientMessageId && m.clientMessageId === incoming.clientMessageId) || m.id === incoming.id
  );
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...incoming };
    return sortByCreatedAtAsc(next);
  }
  return sortByCreatedAtAsc([...list, incoming]);
};

export const useMessageStore = create<MessageState>((set, get) => ({
  byConv: {},
  activeConversationId: null,
  messages: [],

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
      const sorted = sortByCreatedAtAsc([...msgs]);
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

      const shouldUpdateFlat = state.activeConversationId === msg.conversationId;
      return {
        byConv: { ...state.byConv, [msg.conversationId]: updatedForConv },
        messages: shouldUpdateFlat ? [...updatedForConv] : state.messages,
      };
    }),

  loadHistory: (conversationId, older, prepend = true) =>
    set((state) => {
      const current = state.byConv[conversationId] ?? [];
      const merged = prepend ? [...older, ...current] : [...current, ...older];
      const unique = merged.reduce<Message[]>((acc, m) => {
        const dupIdx = acc.findIndex(
          (x) => x.id === m.id || (m.clientMessageId && x.clientMessageId === m.clientMessageId)
        );
        if (dupIdx >= 0) acc[dupIdx] = { ...acc[dupIdx], ...m };
        else acc.push(m);
        return acc;
      }, []);
      const sorted = sortByCreatedAtAsc(unique);
      return {
        byConv: { ...state.byConv, [conversationId]: sorted },
        messages:
          state.activeConversationId === conversationId ? [...sorted] : state.messages,
      };
    }),

  replaceOptimistic: (clientId, serverMsg) =>
    set((state) => {
      const list = state.byConv[serverMsg.conversationId] ?? [];
      const idx = list.findIndex((m) => m.clientMessageId === clientId);
      let nextList: Message[];
      if (idx >= 0) {
        nextList = [...list];
        nextList[idx] = { ...serverMsg, localStatus: 'sent' };
      } else {
        nextList = upsertWithDedupe(list, { ...serverMsg, localStatus: 'sent' });
      }
      return {
        byConv: { ...state.byConv, [serverMsg.conversationId]: nextList },
        messages:
          state.activeConversationId === serverMsg.conversationId ? [...nextList] : state.messages,
      };
    }),

  markStatus: (conversationId, idOrClientId, patch) =>
    set((state) => {
      const list = state.byConv[conversationId] ?? [];
      const idx = list.findIndex(
        (m) => m.id === idOrClientId || m.clientMessageId === idOrClientId
      );
      if (idx < 0) return state;
      const next = [...list];
      next[idx] = { ...next[idx], ...patch };
      return {
        byConv: { ...state.byConv, [conversationId]: next },
        messages:
          state.activeConversationId === conversationId ? [...next] : state.messages,
      };
    }),

  updateMessage: (patch) =>
    set((state) => {
      const convId =
        Object.keys(state.byConv).map(Number).find((cid) =>
          state.byConv[cid]?.some((m) => m.id === patch.id)
        ) ?? state.activeConversationId;

      if (convId == null) return state;

      const list = state.byConv[convId] ?? [];
      const idx = list.findIndex((m) => m.id === patch.id);
      if (idx < 0) return state;

      const next = [...list];
      next[idx] = { ...next[idx], ...patch };
      return {
        byConv: { ...state.byConv, [convId]: next },
        messages: state.activeConversationId === convId ? [...next] : state.messages,
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

      const nextList = (state.byConv[foundConv] ?? []).filter((m) => m.id !== id);
      const nextByConv = { ...state.byConv, [foundConv]: nextList };
      const nextFlat =
        state.activeConversationId === foundConv ? [...nextList] : state.messages;

      return { byConv: nextByConv, messages: nextFlat };
    }),

  clearMessages: () =>
    set((state) => {
      const convId = state.activeConversationId;
      if (convId == null) {
        return { messages: [] };
      }
      return { messages: [] };
    }),
}));
