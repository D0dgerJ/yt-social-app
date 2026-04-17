function getEnv(name: string, fallback?: string): string {
  const value = import.meta.env[name] ?? fallback;

  if (value == null || String(value).trim() === "") {
    throw new Error(`Missing client env variable: ${name}`);
  }

  return String(value).trim();
}

function getOptionalEnv(name: string): string | undefined {
  const value = import.meta.env[name];

  if (value == null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized || undefined;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function stripApiSuffix(url: string): string {
  return stripTrailingSlash(url).replace(/\/api\/v1$/i, "");
}

const rawServerOrigin = getOptionalEnv("VITE_SERVER_ORIGIN");
const rawApiUrl = getOptionalEnv("VITE_API_URL");
const rawSocketUrl = getOptionalEnv("VITE_SOCKET_URL");

const fallbackOrigin =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";

const serverOrigin = stripTrailingSlash(
  rawServerOrigin ??
    (rawApiUrl ? stripApiSuffix(rawApiUrl) : fallbackOrigin)
);

const apiBaseUrl = stripTrailingSlash(
  rawApiUrl ?? `${serverOrigin}/api/v1`
);

const socketUrl = stripTrailingSlash(
  rawSocketUrl ?? serverOrigin
);

export const env = {
  SERVER_ORIGIN: serverOrigin,
  API_BASE_URL: apiBaseUrl,
  SOCKET_URL: socketUrl,
  GIPHY_API_KEY: getOptionalEnv("VITE_GIPHY_API_KEY"),
} as const;