export type ApiErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "VALIDATION"
  | "CONFLICT"
  | "POST_HIDDEN"
  | "POST_DELETED"
  | "INTERNAL";

export class ApiError extends Error {
  public status: number;
  public code: ApiErrorCode;
  public details?: unknown;

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

  postHidden: () => new ApiError(423, "POST_HIDDEN", "Post is hidden"),
  postDeleted: () => new ApiError(410, "POST_DELETED", "Post is deleted"),
};
