import { createClient, type RedisClientType } from "redis";
import { Errors } from "../errors/ApiError.ts";

let client: RedisClientType | null = null;
// connect() возвращает Promise<RedisClientType>, не Promise<void>
let connecting: Promise<RedisClientType> | null = null;

function getClient(): RedisClientType {
  if (client) return client;

  client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
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

  const v = await c.incr(key);

  if (v === 1) {
    await c.expire(key, Math.max(1, windowSec));
  }

  if (v > limit) {
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