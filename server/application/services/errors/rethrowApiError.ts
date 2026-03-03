import { ApiError } from "../../../infrastructure/errors/ApiError.ts";

export function rethrowApiError(err: unknown): never {
  if (err instanceof ApiError) throw err;
  throw err;
}