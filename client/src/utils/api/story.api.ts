import axios from './axiosInstance';

interface CreateStoryInput {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  expiresAt: string;
}

export const createStory = async (data: CreateStoryInput) => {
  const response = await axios.post('/stories', data);
  return response.data;
};

export const deleteStory = async (storyId: number) => {
  const response = await axios.delete(`/stories/${storyId}`);
  return response.data;
};

export const getUserStories = async (userId: number) => {
  const response = await axios.get(`/stories/user/${userId}`);
  return response.data;
};

export const getFeedStories = async () => {
  const response = await axios.get('/stories/feed');
  return response.data;
};

export const getFriendStories = async () => {
  const response = await axios.get('/stories/friends');
  return response.data;
};

export const viewStory = async (storyId: number) => {
  const response = await axios.post(`/stories/view/${storyId}`);
  return response.data;
};

export const getStoryById = async (storyId: number) => {
  const response = await axios.get(`/stories/${storyId}`);
  return response.data;
};