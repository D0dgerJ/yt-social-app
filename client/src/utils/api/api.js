import axios from "axios";

export const API = axios.create({
  baseURL: "http://localhost:5000/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.token = `Bearer ${token}`;
  }
  return config;
});

export const getTimeLinePost = (username) =>
  API.get(`/posts/get-timeline-posts/${username}`);
export const getAllPosts = () => API.get("/posts");
export const getUserData = (userId) => API.get(`/users/${userId}`);
export const getUserProfileData = (username) =>
  API.get(`/users?username=${username}`);

export const likeAndDislikePost = (postId) =>
  API.put(`/posts/like-post/${postId}`);
export const uploadPost = async (userId, desc, img) => {
  const formData = new FormData();
  formData.append("desc", desc);
  if (img) {
  formData.append("img", img);
}

  const res = await API.post("/posts/create-post", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const getUserFriends = (userId) => 
  API.get(`/users/friends/${userId}`);
export const unfollowUser = (id) =>
  API.put(`/users/unfollow/${id}`);
export const followUser = (id) =>
  API.put(`/users/follow/${id}`);
