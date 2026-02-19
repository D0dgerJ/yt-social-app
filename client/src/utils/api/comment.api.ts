import axios from './axiosInstance';

// ===== Типы =====
interface CreateCommentInput {
  postId: number;
  content: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  parentId?: number;
}

interface UpdateCommentInput {
  commentId: number;
  content: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

interface CreateReplyInput {
  postId: number;
  parentId: number;
  content: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

// ===== Комментарии =====
export const createComment = async (data: CreateCommentInput) => {
  const response = await axios.post('/comments', data);
  return response.data;
};

export const updateComment = async (data: UpdateCommentInput) => {
  const response = await axios.put(`/comments/${data.commentId}`, data);
  return response.data;
};

export const deleteComment = async (commentId: number) => {
  const response = await axios.delete(`/comments/${commentId}`);
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

// ===== Ответы (Replies) =====
export const getCommentReplies = async (commentId: number) => {
  const response = await axios.get(`/comments/replies/${commentId}`);
  return response.data;
};

export const createReply = async (data: CreateReplyInput) => {
  const response = await axios.post('/comments', data);
  return response.data;
};

export const updateReply = async (data: UpdateCommentInput) => {
  const response = await axios.put(`/comments/${data.commentId}`, data);
  return response.data;
};

export const deleteReply = async (commentId: number) => {
  const response = await axios.delete(`/comments/${commentId}`);
  return response.data;
};

// ===== Получение количества ответов для нескольких комментариев =====
export const getRepliesCountForMany = async (ids: number[]) => {
  const response = await axios.post(`/comments/replies-count`, { ids });
  return response.data;
};

// ===== Репорты (Moderation) =====
export interface ReportCommentInput {
  reason: string;
  details?: string;
}

export const reportComment = async (commentId: number, data: ReportCommentInput) => {
  const response = await axios.post(`/comments/${commentId}/report`, data);
  return response.data;
};
  