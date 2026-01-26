import axios from "./axiosInstance";

export interface PostPayload {
  desc?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
  tags?: string[];
  location?: string;
}

export type ReportReason =
  | "spam"
  | "abuse"
  | "harassment"
  | "hate"
  | "violence"
  | "nudity"
  | "scam"
  | "other";

export interface ReportPostPayload {
  reason: ReportReason;
  message?: string;
}

export const createPost = async (payload: PostPayload) => {
  const response = await axios.post("/posts", payload);
  return response.data;
};

export const updatePost = async (id: number, payload: PostPayload) => {
  const response = await axios.put(`/posts/${id}`, payload);
  return response.data;
};

export const deletePost = async (postId: number) => {
  const response = await axios.delete(`/posts/${postId}`);
  return response.data;
};

export const toggleLike = async (postId: number) => {
  const response = await axios.put(`/posts/${postId}/like`);
  return response.data;
};

export const savePost = async (postId: number) => {
  const response = await axios.put(`/posts/${postId}/save`);
  return response.data;
};

export const unsavePost = async (postId: number) => {
  const response = await axios.put(`/posts/${postId}/unsave`);
  return response.data;
};

export const reportPost = async (postId: number, payload: ReportPostPayload) => {
  const response = await axios.post(`/posts/${postId}/report`, payload);
  return response.data;
};

export const getAllPosts = async () => {
  const response = await axios.get("/posts");
  return response.data;
};

export const getFeedPosts = async () => {
  const response = await axios.get("/posts/feed");
  return response.data;
};

export const getFeedPostsByUserId = async (userId: number) => {
  const response = await axios.get(`/posts/feed/${userId}`);
  return response.data;
};

export const getPostById = async (id: number) => {
  const response = await axios.get(`/posts/${id}`);
  return response.data;
};

export const getUserPostsFlexible = async (params: { userId?: number; username?: string }) => {
  const search = new URLSearchParams();
  if (typeof params.userId === "number") search.set("userId", String(params.userId));
  if (typeof params.username === "string" && params.username.trim()) search.set("username", params.username.trim());

  const response = await axios.get(`/posts/user?${search.toString()}`);
  return response.data;
};

export const getUserPostsByUserId = async (userId: number) => {
  const response = await axios.get(`/posts/user/${userId}`);
  return response.data;
};

export const getUserPostsByUsername = async (username: string) => {
  const response = await axios.get(`/posts/username/${encodeURIComponent(username)}`);
  return response.data;
};
