import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { Errors } from "../errors/ApiError.js";

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
      if (!req.user?.id || !req.user.role) {
        next(Errors.unauthorized("Unauthorized"));
        return;
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