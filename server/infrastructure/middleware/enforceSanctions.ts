import type { NextFunction, Request, Response } from "express";
import prisma from "../database/prismaClient.ts";
import { Errors } from "../errors/ApiError.ts";
import { UserSanctionStatus, UserSanctionType } from "@prisma/client";

function toIso(d?: Date | null): string | null {
  return d ? d.toISOString() : null;
}

export const enforceSanctions = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      next();
      return;
    }

    const now = new Date();
    
    const active = await prisma.userSanction.findFirst({
      where: {
        userId: req.user.id,
        status: UserSanctionStatus.ACTIVE,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        endsAt: true,
        reason: true,
      },
    });

    if (!active) {
      next();
      return;
    }

    if (active.type === UserSanctionType.TEMP_BAN && active.endsAt && active.endsAt <= now) {
      await prisma.userSanction.update({
        where: { id: active.id },
        data: { status: UserSanctionStatus.EXPIRED },
      });

      next();
      return;
    }

    req.user.sanction = {
      sanctionId: active.id,
      type: active.type,
      endsAt: toIso(active.endsAt),
      reason: active.reason ?? null,
    };

    if (active.type === UserSanctionType.RESTRICT) {
      req.user.isRestricted = true;
      next();
      return;
    }

    if (active.type === UserSanctionType.PERM_BAN || active.type === UserSanctionType.TEMP_BAN) {
      next(
        Errors.forbidden("Account is banned", {
          type: active.type,
          endsAt: toIso(active.endsAt),
          reason: active.reason ?? null,
        }),
      );
      return;
    }

    next();
  } catch (err) {
    next(Errors.internal("Sanctions check failed", err));
  }
};

export const requireNotRestricted = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.user?.isRestricted) {
    next(
      Errors.forbidden("Account is restricted", {
        type: req.user?.sanction?.type ?? "RESTRICT",
        endsAt: req.user?.sanction?.endsAt ?? null,
        reason: req.user?.sanction?.reason ?? null,
      }),
    );
    return;
  }

  next();
};
