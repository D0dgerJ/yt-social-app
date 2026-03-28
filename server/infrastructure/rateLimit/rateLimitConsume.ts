import { memoryRateLimitConsume } from "./memoryRateLimit.ts";
import { redisRateLimitConsume } from "./redisRateLimit.ts";
import { env } from "../../config/env.ts";

export async function rateLimitConsume(params: {
  key: string;
  limit: number;
  windowSec: number;
}) {
  if (env.REDIS_URL) {
    return redisRateLimitConsume(params);
  }

  return memoryRateLimitConsume(params);
}