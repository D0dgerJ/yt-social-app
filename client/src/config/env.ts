const trimSlash = (value: string) => value.replace(/\/+$/, "");

export const env = {
  API_URL: trimSlash(import.meta.env.VITE_API_URL || "http://localhost:5000"),
  SOCKET_URL: trimSlash(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000"),
};