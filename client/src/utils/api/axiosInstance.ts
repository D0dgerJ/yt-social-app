import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = user?.token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default instance;
