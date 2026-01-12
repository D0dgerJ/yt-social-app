import type { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import prisma from '../database/prismaClient.ts';

const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

function getEffectiveRole(dbRole: UserRole, isAdmin: boolean): UserRole {
  if (isAdmin && ROLE_RANK[dbRole] < ROLE_RANK.ADMIN) return UserRole.ADMIN;
  return dbRole;
}

export const requireRole =
  (minRole: UserRole) => async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!req.user.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true, isAdmin: true },
        });

        if (!dbUser) {
          res.status(401).json({ message: 'Unauthorized' });
          return;
        }

        req.user.role = getEffectiveRole(dbUser.role, dbUser.isAdmin);
      }

      const userRank = ROLE_RANK[req.user.role];
      const requiredRank = ROLE_RANK[minRole];

      if (userRank < requiredRank) {
        res.status(403).json({ message: 'Forbidden' });
        return;
      }

      next();
    } catch {
      res.status(500).json({ message: 'Role check failed' });
    }
  };

export const requireModerator = requireRole(UserRole.MODERATOR);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireOwner = requireRole(UserRole.OWNER);