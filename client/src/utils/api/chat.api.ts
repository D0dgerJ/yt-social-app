import axios from './axiosInstance';
import { toast } from 'react-toastify';

// Универсальный обработчик
const handleRequest = async <T>(request: () => Promise<T>): Promise<T> => {
  try {
    return await request();
  } catch (error: any) {
    const message = error.response?.data?.message || "Ошибка сервера";
    toast.error(message);
    throw error;
  }
};

// Создание чата
export const createChat = async (userIds: number[], creatorId: number, name?: string) =>
  handleRequest(() => axios.post('/chat', { userIds, creatorId, name }).then(res => res.data));

// Получение всех чатов пользователя
export const getUserConversations = async () =>
  handleRequest(() => axios.get('/chat').then(res => res.data));

// Отправка сообщения
export const sendMessage = async (
  chatId: number,
  message: {
    content?: string;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker';
    fileName?: string;
    gifUrl?: string;
    stickerUrl?: string;
    repliedToId?: number;
  }
) =>
  handleRequest(() => axios.post(`/chat/${chatId}/messages`, message).then(res => res.data));

// Получение сообщений
export const getChatMessages = async (chatId: number, page = 1, limit = 30) =>
  handleRequest(() =>
    axios.get(`/chat/${chatId}/messages`, { params: { page, limit } }).then(res => res.data)
  );

// Обновление сообщения
export const updateMessage = async (chatId: number, messageId: number, content: string) =>
  handleRequest(() =>
    axios.patch(`/chat/${chatId}/messages/${messageId}`, { content }).then(res => res.data)
  );

// Удаление сообщения
export const deleteMessage = async (chatId: number, messageId: number) =>
  handleRequest(() =>
    axios.delete(`/chat/${chatId}/messages/${messageId}`).then(res => res.data)
  );

// Выйти из чата
export const leaveConversation = async (chatId: number) =>
  handleRequest(() =>
    axios.delete(`/chat/${chatId}/leave`, {
      data: { conversationId: chatId },
    }).then(res => res.data)
  );

// Добавить участника в чат
export const addParticipant = async (chatId: number, userId: number) =>
  handleRequest(() =>
    axios.post(`/chat/${chatId}/participants`, {
      conversationId: chatId,
      userId,
    }).then(res => res.data)
  );

// Получить реакции к сообщению
export const getMessageReactions = async (messageId: number) =>
  handleRequest(() =>
    axios.get(`/chat/messages/${messageId}/reactions`).then(res => res.data)
  );

// Поставить/обновить реакцию
export const reactToMessage = async (messageId: number, emoji: string) =>
  handleRequest(() =>
    axios.post(`/chat/messages/${messageId}/react`, { emoji }).then(res => res.data)
  );

// Отметить как доставленные
export const markAsDelivered = async (chatId: number) =>
  handleRequest(() => axios.post(`/chat/${chatId}/delivered`).then(res => res.data));

// Отметить как прочитанные
export const markAsRead = async (chatId: number) =>
  handleRequest(() => axios.post(`/chat/${chatId}/read`).then(res => res.data));
