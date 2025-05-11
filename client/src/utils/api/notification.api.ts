import axios from './axiosInstance';

interface NotificationInput {
  userId: number;
  type: 'like' | 'follow' | 'save';
  postId?: number;
  senderId?: number;
}

export const createNotification = async (data: NotificationInput) => {
  const response = await axios.post('/notifications', data);
  return response.data;
};

export const deleteNotification = async (id: number) => {
  const response = await axios.delete(`/notifications/${id}`);
  return response.data;
};

export const markNotificationAsRead = async (id: number) => {
  const response = await axios.patch(`/notifications/${id}/read`);
  return response.data;
};

export const getUserNotifications = async (userId: number) => {
  const response = await axios.get(`/notifications/user/${userId}`);
  return response.data;
};