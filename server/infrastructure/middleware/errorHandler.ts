import { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/ApiError.ts";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Логи — оставляем
  console.error("[errorHandler]", err);

  // Если это наша типизированная ошибка — отдаём её
  if (err instanceof ApiError) {
    res.status(err.status).json({
      message: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  // Любая другая ошибка — 500
  res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL",
  });
};
