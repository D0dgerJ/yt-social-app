import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import prisma from "../database/prismaClient.ts";
import { Errors } from "../errors/ApiError.ts";

const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const requireRole =
  (minRole: UserRole) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        next(Errors.unauthorized("Unauthorized"));
        return;
      }

      if (!req.user.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true },
        });

        if (!dbUser) {
          next(Errors.unauthorized("Unauthorized"));
          return;
        }

        req.user.role = dbUser.role;
      }

      const userRank = ROLE_RANK[req.user.role];
      const requiredRank = ROLE_RANK[minRole];

      if (userRank < requiredRank) {
        next(Errors.forbidden("Forbidden"));
        return;
      }

      next();
    } catch (err) {
      next(Errors.internal("Role check failed", err));
    }
  };

export const requireModerator = requireRole(UserRole.MODERATOR);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireOwner = requireRole(UserRole.OWNER);