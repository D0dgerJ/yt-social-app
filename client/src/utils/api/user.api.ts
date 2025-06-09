import axios from './axiosInstance';

export const createUser = async (user: { username: string; email: string }) => {
  const response = await axios.post("/users", user);
  return response.data;
};

export const getUserById = async (id: number) => {
  const response = await axios.get(`/users/${id}`);
  return response.data;
};

export const deleteUser = async () => {
  const response = await axios.delete('/users');
  return response.data;
};

export const updateUser = async (data: {
  username?: string;
  email?: string;
  password?: string;
}) => {
  const response = await axios.put('/users', data);
  return response.data;
};

export const updateProfilePicture = async (formData: FormData) => {
  const response = await axios.put('/users/profile-picture', formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getUserProfile = async () => {
  const response = await axios.get('/users/profile');
  return response.data;
};

export const getUserFriends = async (userId: number) => {
  const response = await axios.get(`/users/friends/${userId}`);
  return response.data;
};

export const getUserByUsername = async (username: string) => {
  const response = await axios.get(`/users/username/${username}`);
  return response.data;
};

export const followUser = async (userId: number) => {
  const response = await axios.put(`/users/${userId}/follow`);
  return response.data;
};

export const unfollowUser = async (userId: number) => {
  const response = await axios.put(`/users/${userId}/unfollow`);
  return response.data;
};

export const getUserFollowing = async (userId: number) => {
  const response = await axios.get(`/users/following/${userId}`);
  return response.data;
};

export const getUserFollowers = async (userId: number) => {
  const response = await axios.get(`/users/followers/${userId}`);
  return response.data;
};

export const sendFriendRequest = async (userId: number) => {
  const response = await axios.post(`/users/friend-request/${userId}`);
  return response.data;
};

export const acceptFriendRequest = async (requestId: number) => {
  const response = await axios.post(`/users/friend-request/${requestId}/accept`);
  return response.data;
};

export const rejectFriendRequest = async (requestId: number) => {
  const response = await axios.post(`/users/friend-request/${requestId}/reject`);
  return response.data;
};

export const cancelFriendRequest = async (userId: number) => {
  const response = await axios.delete(`/users/friend-request/${userId}`);
  return response.data;
};

export const getIncomingFriendRequests = async () => {
  const response = await axios.get(`/users/friend-requests/incoming`);
  return response.data;
};

export const getOutgoingFriendRequests = async () => {
  const response = await axios.get(`/users/friend-requests/outgoing`);
  return response.data;
};


export const getFollowers = async (userId: number) => {
  const response = await axios.get(`/users/followers/${userId}`);
  return response.data;
};

export const getFollowings = async (userId: number) => {
  const response = await axios.get(`/users/following/${userId}`);
  return response.data;
};