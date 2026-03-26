import axios from "axios";
import { getToken } from "@/utils/authStorage";
import { env } from "@/config/env";

const instance = axios.create({
  baseURL: `${env.API_URL}/api/v1`,
  withCredentials: true,
});

instance.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default instance;