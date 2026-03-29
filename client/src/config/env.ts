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
  return normalized ? normalized : undefined;
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const env = {
  API_URL: normalizeBaseUrl(
    getEnv("VITE_API_URL", "http://localhost:5000")
  ),
  SOCKET_URL: normalizeBaseUrl(
    getEnv("VITE_SOCKET_URL", "http://localhost:5000")
  ),
  GIPHY_API_KEY: getOptionalEnv("VITE_GIPHY_API_KEY"),
} as const;