import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Errors } from "../errors/ApiError.ts";

interface JwtPayload {
  userId: number;
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(Errors.unauthorized("Unauthorized"));
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = { id: decoded.userId };
    next();
  } catch {
    next(Errors.unauthorized("Unauthorized"));
  }
};
