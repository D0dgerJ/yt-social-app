import axios from './axiosInstance';
import { toast } from 'react-toastify';

const handleRequest = async <T>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request();
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Ошибка сервера';
    toast.error(message);
    throw error;
  }
};

// ----------------- Загрузка файлов -----------------
export const uploadFiles = async (files: File[]) =>
  handleRequest(async () => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));

    const { data } = await axios.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const raw = Array.isArray(data?.files)
      ? data.files
      : Array.isArray(data?.urls)
      ? data.urls
      : [];

    const urls = raw.map((x: any, i: number) => ({
      url: x.url ?? x.path ?? x.location,
      mime: x.mime ?? files[i]?.type ?? 'application/octet-stream',
      name: x.name ?? files[i]?.name ?? `file-${i + 1}`,
    }));

    return { urls };
  });

// ----------------- Чаты -----------------

export const createChat = async (userIds: number[], creatorId: number, name?: string) =>
  handleRequest(() => axios.post('/chat', { userIds, creatorId, name }).then((res) => res.data));

export const getUserConversations = async () =>
  handleRequest(() => axios.get('/chat').then((res) => res.data));

// ----------------- Сообщения -----------------

export type SendMessageBody = {
  content?: string;
  encryptedContent?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker' | null;
  fileName?: string;
  gifUrl?: string;
  stickerUrl?: string;
  repliedToId?: number;
  clientMessageId?: string | null;
};

export const sendMessage = async (chatId: number, message: SendMessageBody) =>
  handleRequest(() => axios.post(`/chat/${chatId}/messages`, message).then((res) => res.data));

// cursor-based история
export const getChatMessages = async (
  chatId: number,
  opts: { cursorId?: number | null; direction?: 'forward' | 'backward'; limit?: number } = {},
) =>
  handleRequest(async () => {
    const params: any = {};
    if (opts.cursorId != null) params.cursorId = opts.cursorId;
    if (opts.direction) params.direction = opts.direction;
    if (opts.limit != null) params.limit = opts.limit;

    const { data } = await axios.get(`/chat/${chatId}/messages`, { params });

    const messages = Array.isArray(data) ? data : data?.messages ?? [];
    const nextCursor = data?.pageInfo?.nextCursor;
    const prevCursor = data?.pageInfo?.prevCursor;

    return { messages, nextCursor, prevCursor };
  });

export const updateMessage = async (chatId: number, messageId: number, content: string) =>
  handleRequest(() =>
    axios.patch(`/chat/${chatId}/messages/${messageId}`, { content }).then((res) => res.data),
  );

export const updateMessageByClientId = async (
  chatId: number,
  clientMessageId: string,
  content: string,
) =>
  handleRequest(() =>
    axios
      .patch(`/chat/${chatId}/messages/0`, { clientMessageId, content })
      .then((res) => res.data),
  );

export const deleteMessage = async (chatId: number, messageId: number) =>
  handleRequest(() => axios.delete(`/chat/${chatId}/messages/${messageId}`).then((res) => res.data));

// ----------------- Участники -----------------

export const leaveConversation = async (chatId: number) =>
  handleRequest(() => axios.delete(`/chat/${chatId}/leave`).then((res) => res.data));

export const addParticipant = async (
  chatId: number,
  userId: number,
  role: 'member' | 'admin' | 'owner' = 'member',
) =>
  handleRequest(() =>
    axios.post(`/chat/${chatId}/participants`, { userId, role }).then((res) => res.data),
  );

// ----------------- Реакции -----------------

export const getMessageReactions = async (messageId: number) =>
  handleRequest(() =>
    axios.get(`/chat/messages/${messageId}/reactions`).then((res) => {
      const d = res.data;
      return Array.isArray(d) ? d : Array.isArray(d?.reactions) ? d.reactions : [];
    }),
  );

export const reactToMessage = async (messageId: number, emoji: string) =>
  handleRequest(() =>
    axios.post(`/chat/messages/${messageId}/react`, { emoji }).then((res) => res.data),
  );

// ----------------- Статусы -----------------

export const markAsDelivered = async (chatId: number) =>
  handleRequest(() => axios.post(`/chat/${chatId}/delivered`).then((res) => res.data));

export const markAsRead = async (chatId: number) =>
  handleRequest(() => axios.post(`/chat/${chatId}/read`).then((res) => res.data));
