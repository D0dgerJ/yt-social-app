import axios from './axiosInstance';

interface CreateCommentInput {
  postId: number;
  content: string;
}

interface UpdateCommentInput {
  commentId: number;
  content: string;
}

export const createComment = async (data: CreateCommentInput) => {
  const response = await axios.post('/comments', data);
  return response.data;
};

export const deleteComment = async (commentId: number) => {
  const response = await axios.delete(`/comments/${commentId}`);
  return response.data;
};

export const updateComment = async (data: UpdateCommentInput) => {
  const response = await axios.put(`/comments/${data.commentId}`, { content: data.content });
  return response.data;
};

export const getPostComments = async (postId: number) => {
  const response = await axios.get(`/comments/post/${postId}`);
  return response.data;
};

export const toggleCommentLike = async (commentId: number) => {
  const response = await axios.put(`/comments/${commentId}/like`);
  return response.data;
};