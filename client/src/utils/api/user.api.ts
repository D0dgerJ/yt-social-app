import axios from './axiosInstance';

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

export const followUser = async (userId: number) => {
  const response = await axios.put(`/users/follow/${userId}`);
  return response.data;
};

export const unfollowUser = async (userId: number) => {
  const response = await axios.put(`/users/unfollow/${userId}`);
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