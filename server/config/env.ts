import dotenv from "dotenv";

dotenv.config();

const required = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  JWT_SECRET: required("JWT_SECRET", "dev_jwt_secret"),
  CLIENT_URL: required("CLIENT_URL", "http://localhost:5173"),
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};