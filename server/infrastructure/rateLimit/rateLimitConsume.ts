import { memoryRateLimitConsume } from "./memoryRateLimit.ts";
import { redisRateLimitConsume } from "./redisRateLimit.ts";

export async function rateLimitConsume(params: {
  key: string;
  limit: number;
  windowSec: number;
}) {
  if (process.env.REDIS_URL) {
    return redisRateLimitConsume(params);
  }
  return memoryRateLimitConsume(params);
}