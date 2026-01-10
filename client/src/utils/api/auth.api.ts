import type { User } from '@/stores/userStore';
import axios from './axiosInstance';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export const loginUser = async (credentials: LoginInput): Promise<User> => {
  const { data } = await axios.post('/auth/login', credentials);
  return data as User;
};

export const registerUser = async (payload: RegisterInput): Promise<User> => {
  const { data } = await axios.post('/auth/register', payload);
  return data as User;
};

export const getMe = async (): Promise<User> => {
  const { data } = await axios.get('/auth/me');
  return data as User;
};
