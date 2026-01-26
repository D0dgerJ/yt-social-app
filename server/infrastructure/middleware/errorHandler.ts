import type { Request, Response, NextFunction } from "express";
import { ApiError, Errors } from "../errors/ApiError.ts";

type PrismaLikeError = {
  code?: string;
  message?: string;
  meta?: { target?: string[] } | unknown;
};

function getPrismaTarget(meta: PrismaLikeError["meta"]): string[] | undefined {
  const m = meta as { target?: unknown } | undefined;
  if (!m || !Array.isArray(m.target)) return undefined;
  return m.target.filter((x): x is string => typeof x === "string");
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error("[errorHandler]", err);

  if (err instanceof ApiError) {
    res.status(err.status).json({
      message: err.message,
      code: err.code,
      ...(err.details !== undefined ? { details: err.details } : {}),
    });
    return;
  }

  const pe = err as PrismaLikeError;

  if (pe?.code === "P2025") {
    const e = Errors.notFound("Not found");
    res.status(e.status).json({ message: e.message, code: e.code });
    return;
  }

  if (pe?.code === "P2002") {
    const e = Errors.conflict("Conflict");
    const target = getPrismaTarget(pe.meta);

    res.status(e.status).json({
      message: e.message,
      code: e.code,
      ...(target ? { details: { target } } : {}),
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error",
    code: "INTERNAL",
  });
};
