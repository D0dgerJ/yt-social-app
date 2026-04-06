import { memoryRateLimitConsume } from "./memoryRateLimit.js";
import { redisRateLimitConsume } from "./redisRateLimit.js";
import { env } from "../../config/env.js";

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