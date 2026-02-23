import { Errors } from "../errors/ApiError.ts";

type Bucket = { count: number; resetAtMs: number };
const buckets = new Map<string, Bucket>();

export function memoryRateLimitConsume(params: {
  key: string;
  limit: number;
  windowSec: number;
}) {
  const { key, limit, windowSec } = params;

  const t = Date.now();
  const windowMs = Math.max(1, windowSec) * 1000;

  const b = buckets.get(key);
  if (!b || b.resetAtMs <= t) {
    buckets.set(key, { count: 1, resetAtMs: t + windowMs });
    return;
  }

  b.count += 1;
  if (b.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((b.resetAtMs - t) / 1000));
    throw Errors.tooManyRequests(`Too many requests. Retry after ${retryAfterSec}s`, retryAfterSec);
  }
}