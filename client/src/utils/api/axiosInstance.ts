import axios from "axios";
import { getToken, clearAuthStorage } from "@/utils/authStorage";
import { env } from "@/config/env";

const instance = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearAuthStorage();

      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default instance;