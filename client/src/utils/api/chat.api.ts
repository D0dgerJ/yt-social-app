import axios from './axiosInstance';

// Создание чата
export const createChat = async (userIds: number[], creatorId: number, name?: string) => {
  console.log("Отправляем на сервер:", { userIds, creatorId, name });
  const response = await axios.post('/chat', { userIds, creatorId, name });
  return response.data;
};

// Получение всех чатов пользователя
export const getUserConversations = async () => {
  const response = await axios.get('/chat');
  return response.data;
};

// Отправка сообщения
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
  const response = await axios.post(`/chat/${chatId}/messages`, message);
  return response.data;
};

// Получение сообщений
export const getChatMessages = async (chatId: number, page = 1, limit = 30) => {
  const response = await axios.get(`/chat/${chatId}/messages`, {
    params: { page, limit },
  });
  return response.data;
};

// Обновление сообщения
export const updateMessage = async (chatId: number, messageId: number, content: string) => {
  const response = await axios.patch(`/chat/${chatId}/messages/${messageId}`, { content });
  return response.data;
};

// Удаление сообщения
export const deleteMessage = async (chatId: number, messageId: number) => {
  const response = await axios.delete(`/chat/${chatId}/messages/${messageId}`);
  return response.data;
};

// Выйти из чата
export const leaveConversation = async (chatId: number) => {
  const response = await axios.delete(`/chat/${chatId}/leave`, {
    data: { conversationId: chatId },
  });
  return response.data;
};

// Добавить участника в чат
export const addParticipant = async (chatId: number, userId: number) => {
  const response = await axios.post(`/chat/${chatId}/participants`, {
    conversationId: chatId,
    userId,
  });
  return response.data;
};

// Получить реакции к сообщению
export const getMessageReactions = async (messageId: number) => {
  const response = await axios.get(`/chat/messages/${messageId}/reactions`);
  return response.data;
};

// Поставить/обновить реакцию
export const reactToMessage = async (messageId: number, emoji: string) => {
  const response = await axios.post(`/chat/messages/${messageId}/react`, { emoji });
  return response.data;
}; 

// Отметить как доставленные
export const markAsDelivered = async (chatId: number) => {
  const response = await axios.post(`/chat/${chatId}/delivered`);
  return response.data;
};

// Отметить как прочитанные
export const markAsRead = async (chatId: number) => {
  const response = await axios.post(`/chat/${chatId}/read`);
  return response.data;
};
