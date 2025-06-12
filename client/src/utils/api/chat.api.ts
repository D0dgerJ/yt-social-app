import axios from './axiosInstance';

// Создание беседы
export const createChat = async (participantIds: number[], name?: string) => {
  const response = await axios.post('/chats', { participantIds, name });
  return response.data;
};

// Получение всех бесед пользователя
export const getUserConversations = async () => {
  const response = await axios.get('/chats');
  return response.data;
};

// Отправка сообщения (с поддержкой медиа, replies, GIF, стикеров и т.д.)
export const sendMessage = async (
  chatId: number,
  message: {
    content?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'file' | 'gif' | 'audio' | 'text' | 'sticker';
    fileName?: string;
    gifUrl?: string;
    stickerUrl?: string;
    repliedToId?: number;
  }
) => {
  const response = await axios.post(`/chats/${chatId}/messages`, message);
  return response.data;
};

// Получение сообщений (с пагинацией опционально)
export const getChatMessages = async (chatId: number, page = 1, limit = 30) => {
  const response = await axios.get(`/chats/${chatId}/messages`, {
    params: { page, limit },
  });
  return response.data;
};

// Обновление сообщения
export const updateMessage = async (
  chatId: number,
  messageId: number,
  content: string
) => {
  const response = await axios.patch(`/chats/${chatId}/messages/${messageId}`, { content });
  return response.data;
};

// Удаление сообщения
export const deleteMessage = async (chatId: number, messageId: number) => {
  const response = await axios.delete(`/chats/${chatId}/messages/${messageId}`);
  return response.data;
};

// Выйти из беседы
export const leaveConversation = async (chatId: number) => {
  const response = await axios.post(`/chats/${chatId}/leave`);
  return response.data;
};

// Удалить чат (если пустой)
export const deleteConversationIfEmpty = async (chatId: number) => {
  const response = await axios.delete(`/chats/${chatId}`);
  return response.data;
};

// Добавить участника в чат
export const addParticipant = async (chatId: number, userId: number) => {
  const response = await axios.post(`/chats/${chatId}/participants`, { userId });
  return response.data;
};

// Получить реакции к сообщению
export const getMessageReactions = async (messageId: number) => {
  const response = await axios.get(`/messages/${messageId}/reactions`);
  return response.data;
};

// Поставить или обновить реакцию
export const reactToMessage = async (messageId: number, emoji: string) => {
  const response = await axios.post(`/messages/${messageId}/reactions`, { emoji });
  return response.data;
};

// Удалить реакцию
export const removeReaction = async (messageId: number) => {
  const response = await axios.delete(`/messages/${messageId}/reactions`);
  return response.data;
};

// Отметить сообщения как доставленные
export const markAsDelivered = async (chatId: number) => {
  const response = await axios.post(`/chats/${chatId}/delivered`);
  return response.data;
};

// Отметить сообщения как прочитанные
export const markAsRead = async (chatId: number) => {
  const response = await axios.post(`/chats/${chatId}/read`);
  return response.data;
};
