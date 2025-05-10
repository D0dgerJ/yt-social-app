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

interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  profilePicture?: string;
  createdAt?: string;
}

export const loginUser = async (credentials: LoginInput): Promise<AuthResponse> => {
  try {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const registerUser = async (data: RegisterInput): Promise<AuthResponse> => {
  const response = await axios.post('/auth/register', data);
  return response.data;
};

export const getMe = async (): Promise<AuthResponse> => {
  const response = await axios.get('/auth/me');
  return response.data;
};
