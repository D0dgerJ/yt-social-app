import axios from "./axiosInstance";

export type ReportStatus = "PENDING" | "APPROVED" | "REJECTED";

export const hidePost = async (postId: number, reason?: string) => {
  const response = await axios.post(`/mod/posts/${postId}/hide`, { reason });
  return response.data;
};

export const unhidePost = async (postId: number, reason?: string) => {
  const response = await axios.post(`/mod/posts/${postId}/unhide`, { reason });
  return response.data;
};

export const softDeletePost = async (postId: number, reason: string) => {
  const response = await axios.post(`/mod/posts/${postId}/soft-delete`, { reason });
  return response.data;
};

export const hardDeletePost = async (postId: number, reason: string) => {
  const response = await axios.delete(`/mod/posts/${postId}/hard-delete`, {
    data: { reason },
  });
  return response.data;
};

export interface ModerationTableItem {
  postId: number;
  reportCount: number;
  lastReport: {
    id: number;
    reason: string;
    message?: string | null;
    createdAt: string;
    reporter: {
      id: number;
      username: string;
    };
  } | null;
  post: {
    id: number;
    userId: number;
    desc: string;
    status: string;
    createdAt: string;
    user: {
      id: number;
      username: string;
    };
  } | null;
}

export const getReportedPostsTable = async (params?: {
  status?: ReportStatus;
  postId?: number;
  take?: number;
  skip?: number;
}) => {
  const search = new URLSearchParams();

  if (params?.status) search.set("status", params.status);
  if (params?.postId) search.set("postId", String(params.postId));
  if (params?.take) search.set("take", String(params.take));
  if (params?.skip) search.set("skip", String(params.skip));

  const response = await axios.get(`/mod/reports/posts?${search.toString()}`);
  return response.data;
};

export const getReportItems = async (params?: {
  status?: ReportStatus;
  postId?: number;
  take?: number;
  skip?: number;
}) => {
  const search = new URLSearchParams();

  if (params?.status) search.set("status", params.status);
  if (params?.postId) search.set("postId", String(params.postId));
  if (params?.take) search.set("take", String(params.take));
  if (params?.skip) search.set("skip", String(params.skip));

  const response = await axios.get(`/mod/reports/posts/items?${search.toString()}`);
  return response.data;
};

export const getReportById = async (reportId: number) => {
  const response = await axios.get(`/mod/reports/posts/${reportId}`);
  return response.data;
};

export const approveReport = async (
  reportId: number,
  payload: { reason: string; message?: string }
) => {
  const response = await axios.post(`/mod/reports/posts/${reportId}/approve`, payload);
  return response.data;
};

export const rejectReport = async (
  reportId: number,
  payload: { reason: string; message?: string }
) => {
  const response = await axios.post(`/mod/reports/posts/${reportId}/reject`, payload);
  return response.data;
};