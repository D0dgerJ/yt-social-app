import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../database/prismaClient.ts";
import { Errors } from "../errors/ApiError.ts";

export const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return next();

    const token = header.split(" ")[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id?: number };
    if (!decoded?.id) return next();

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true },
    });

    if (!user) return next();

    // req.user уже используется у тебя в проекте
    (req as any).user = user;

    next();
  } catch (e) {
    // Если токен передан, но он битый — это ошибка
    next(Errors.unauthorized("Invalid token"));
  }
};