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
  // Совместимость со старым флагом:
  // если isAdmin=true, то минимум ADMIN
  if (isAdmin && ROLE_RANK[dbRole] < ROLE_RANK.ADMIN) return UserRole.ADMIN;
  return dbRole;
}

export const requireRole =
  (minRole: UserRole) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Если роль уже есть в req.user — используем её.
      // Но в v1 authMiddleware кладёт только id, поэтому чаще всего будет запрос в БД.
      if (!req.user.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true, isAdmin: true },
        });

        if (!dbUser) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user.role = getEffectiveRole(dbUser.role, dbUser.isAdmin);
      }

      const userRank = ROLE_RANK[req.user.role];
      const requiredRank = ROLE_RANK[minRole];

      if (userRank < requiredRank) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      return next();
    } catch (e) {
      return res.status(500).json({ message: 'Role check failed' });
    }
  };

export const requireModerator = requireRole(UserRole.MODERATOR);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireOwner = requireRole(UserRole.OWNER);