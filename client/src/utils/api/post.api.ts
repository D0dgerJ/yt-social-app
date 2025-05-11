import axios from './axiosInstance';

interface PostPayload {
  desc: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const createPost = async (payload: PostPayload) => {
  const response = await axios.post('/posts', payload);
  return response.data;
};

export const updatePost = async (id: number, payload: PostPayload) => {
  const response = await axios.put(`/posts/${id}`, payload);
  return response.data;
};

export const deletePost = async (postId: number) => {
  const response = await axios.delete('/posts', { data: { postId } });
  return response.data;
};

export const toggleLike = async (postId: number) => {
  const response = await axios.post('/posts/like', { postId });
  return response.data;
};

export const savePost = async (postId: number) => {
  const response = await axios.post('/posts/save', { postId });
  return response.data;
};

export const unsavePost = async (postId: number) => {
  const response = await axios.post('/posts/unsave', { postId });
  return response.data;
};

export const getUserPosts = async () => {
  const response = await axios.get('/posts/user');
  return response.data;
};

export const getFeedPosts = async () => {
  const response = await axios.get('/posts/feed');
  return response.data;
};

export const getPostById = async (id: number) => {
  const response = await axios.get(`/posts/${id}`);
  return response.data;
};
