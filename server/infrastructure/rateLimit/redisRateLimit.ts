import { createClient, type RedisClientType } from "redis";
import { Errors } from "../errors/ApiError.js";
import { env } from "../../config/env.js";

let client: RedisClientType | null = null;
let connecting: Promise<RedisClientType> | null = null;

function getClient(): RedisClientType {
  if (client) return client;

  client = createClient({
    url: env.REDIS_URL ?? "redis://localhost:6379",
  });

  client.on("error", (err) => {
    console.error("[redisRateLimit] Redis error:", err);
  });

  return client;
}

async function ensureConnected() {
  const c = getClient();

  if (c.isOpen) return;

  if (!connecting) {
    connecting = c.connect().catch((err) => {
      connecting = null;
      throw err;
    });
  }

  await connecting;
}

export async function redisRateLimitConsume(params: {
  key: string;
  limit: number;
  windowSec: number;
}) {
  const { key, limit, windowSec } = params;

  await ensureConnected();
  const c = getClient();

  const value = await c.incr(key);

  if (value === 1) {
    await c.expire(key, Math.max(1, windowSec));
  }

  if (value > limit) {
    const ttl = await c.ttl(key);
    const retryAfterSec = Math.max(
      1,
      Number.isFinite(ttl) && ttl > 0 ? ttl : windowSec
    );

    throw Errors.tooManyRequests(
      `Too many requests. Retry after ${retryAfterSec}s`,
      retryAfterSec
    );
  }
}