import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "development" | "test" | "production";
type StorageProvider = "local" | "s3";

function getString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value == null || value === "") {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
}

function getOptionalString(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function getNumber(name: string, fallback?: number): number {
  const raw =
    process.env[name] ?? (fallback != null ? String(fallback) : undefined);

  if (raw == null) {
    throw new Error(`Missing env variable: ${name}`);
  }

  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Env variable ${name} must be a number`);
  }

  return value;
}

function getBoolean(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

function getList(name: string, fallback?: string): string[] {
  const raw = process.env[name] ?? fallback ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const NODE_ENV = (process.env.NODE_ENV ?? "development") as NodeEnv;
const STORAGE_PROVIDER = (process.env.STORAGE_PROVIDER ?? "local") as StorageProvider;

if (!["local", "s3"].includes(STORAGE_PROVIDER)) {
  throw new Error(
    `Invalid STORAGE_PROVIDER="${STORAGE_PROVIDER}". Allowed values: local | s3`
  );
}

export const env = {
  NODE_ENV,
  isDev: NODE_ENV === "development",
  isTest: NODE_ENV === "test",
  isProd: NODE_ENV === "production",

  PORT: getNumber("PORT", 5000),
  DATABASE_URL: getString("DATABASE_URL"),
  JWT_SECRET: getString("JWT_SECRET"),
  CLIENT_URL: getString("CLIENT_URL", "http://localhost:5173"),
  CORS_ORIGINS: getList(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
  ),

  REDIS_URL: getOptionalString("REDIS_URL"),

  STORAGE_PROVIDER,

  S3_ENDPOINT: getOptionalString("S3_ENDPOINT"),
  S3_REGION: getOptionalString("S3_REGION") ?? "us-east-1",
  S3_BUCKET: getOptionalString("S3_BUCKET"),
  S3_ACCESS_KEY: getOptionalString("S3_ACCESS_KEY"),
  S3_SECRET_KEY: getOptionalString("S3_SECRET_KEY"),
  S3_PUBLIC_BASE_URL: getOptionalString("S3_PUBLIC_BASE_URL"),
  S3_FORCE_PATH_STYLE: getBoolean("S3_FORCE_PATH_STYLE", false),

  WHISPER_PYTHON: getOptionalString("WHISPER_PYTHON") ?? "python",
  WHISPER_SCRIPT: getOptionalString("WHISPER_SCRIPT"),
  WHISPER_MODEL: getOptionalString("WHISPER_MODEL"),

  MODERATION_OUTBOX_ENABLED: getBoolean("MODERATION_OUTBOX_ENABLED", true),
  STORY_CLEANER_ENABLED: getBoolean("STORY_CLEANER_ENABLED", true),

  SEED_EMAIL: getOptionalString("SEED_EMAIL"),
  SEED_USERNAME: getOptionalString("SEED_USERNAME"),
  SEED_PASSWORD: getOptionalString("SEED_PASSWORD"),
  SEED_ROLE: getOptionalString("SEED_ROLE") ?? "ADMIN",
} as const;

if (env.STORAGE_PROVIDER === "s3") {
  if (
    !env.S3_ENDPOINT ||
    !env.S3_BUCKET ||
    !env.S3_ACCESS_KEY ||
    !env.S3_SECRET_KEY ||
    !env.S3_PUBLIC_BASE_URL
  ) {
    throw new Error(
      "STORAGE_PROVIDER=s3 requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_BASE_URL"
    );
  }
}