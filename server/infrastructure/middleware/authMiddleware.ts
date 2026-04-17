import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../database/prismaClient.js";
import { Errors } from "../errors/ApiError.js";
import { env } from "../../config/env.js";

interface JwtPayload {
  userId: number;
}

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(Errors.unauthorized("Unauthorized"));
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (!decoded?.userId) {
      next(Errors.unauthorized("Unauthorized"));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      next(Errors.unauthorized("Unauthorized"));
      return;
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch {
    next(Errors.unauthorized("Unauthorized"));
  }
};