import axios from './axiosInstance';

export const createChat = async (participantIds: number[]) => {
  const response = await axios.post('/chats', { participantIds });
  return response.data;
};

export const getUserConversations = async () => {
  const response = await axios.get('/chats');
  return response.data;
};

export const sendMessage = async (chatId: number, content: string) => {
  const response = await axios.post(`/chats/${chatId}/messages`, { content });
  return response.data;
};

export const updateMessage = async (chatId: number, messageId: number, content: string) => {
  const response = await axios.patch(`/chats/${chatId}/messages/${messageId}`, { content });
  return response.data;
};

export const deleteMessage = async (chatId: number, messageId: number) => {
  const response = await axios.delete(`/chats/${chatId}/messages/${messageId}`);
  return response.data;
};

export const leaveConversation = async (chatId: number) => {
  const response = await axios.post(`/chats/${chatId}/leave`);
  return response.data;
};

export const deleteConversationIfEmpty = async (chatId: number) => {
  const response = await axios.delete(`/chats/${chatId}`);
  return response.data;
};

export const addParticipant = async (chatId: number, userId: number) => {
  const response = await axios.post(`/chats/${chatId}/participants`, { userId });
  return response.data;
};