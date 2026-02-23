export type ApiErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "CONFLICT"
  | "TOO_MANY_REQUESTS"
  | "POST_HIDDEN"
  | "POST_DELETED"
  | "INTERNAL";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  notFound: (message = "Not found", details?: unknown) =>
    new ApiError(404, "NOT_FOUND", message, details),

  forbidden: (message = "Forbidden", details?: unknown) =>
    new ApiError(403, "FORBIDDEN", message, details),

  unauthorized: (message = "Unauthorized", details?: unknown) =>
    new ApiError(401, "UNAUTHORIZED", message, details),

  validation: (message = "Validation error", details?: unknown) =>
    new ApiError(400, "VALIDATION", message, details),

  conflict: (message = "Conflict", details?: unknown) =>
    new ApiError(409, "CONFLICT", message, details),

  tooManyRequests: (message = "Too many requests", retryAfterSec?: number) =>
    new ApiError(
      429,
      "TOO_MANY_REQUESTS",
      message,
      typeof retryAfterSec === "number" ? { retryAfterSec } : undefined
    ),

  postHidden: (message = "Post is hidden", details?: unknown) =>
    new ApiError(403, "POST_HIDDEN", message, details),

  postDeleted: (message = "Post is deleted", details?: unknown) =>
    new ApiError(403, "POST_DELETED", message, details),

  internal: (message = "Internal error", details?: unknown) =>
    new ApiError(500, "INTERNAL", message, details),
};