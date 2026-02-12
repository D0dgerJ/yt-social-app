import type { Prisma } from "@prisma/client";
import { ModerationTargetType, UserSanctionStatus, UserSanctionType } from "@prisma/client";
import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export type ModerationUserDetails = {
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    desc: string | null;
    profilePicture: string | null;
    coverPicture: string | null;
    from: string | null;
    city: string | null;
    relationship: number | null;
  };
  activeSanctions: Array<{
    id: number;
    type: string;
    status: string;
    reason: string;
    message: string | null;
    startsAt: Date;
    endsAt: Date | null;
    createdAt: Date;
    createdById: number;
  }>;
  recentSanctions: Array<{
    id: number;
    type: string;
    status: string;
    reason: string;
    message: string | null;
    startsAt: Date;
    endsAt: Date | null;
    createdAt: Date;
    createdById: number;
    liftedAt: Date | null;
    liftedById: number | null;
    liftReason: string | null;
  }>;
  sanctionsSummary: {
    total: number;
    active: number;
    isBanned: boolean;
    isRestricted: boolean;
    lastSanctionAt: Date | null;
  };
  recentActions: Array<{
    id: number;
    actionType: string;
    targetType: string;
    targetId: string;
    reason: string | null;
    createdAt: Date;
    actor: { id: number; username: string; role: string } | null;
  }>;
};

export async function getModerationUserById(userId: number): Promise<ModerationUserDetails> {
  const now = new Date();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      desc: true,
      profilePicture: true,
      coverPicture: true,
      from: true,
      city: true,
      relationship: true,
    },
  });

  if (!user) throw Errors.notFound("User not found");

  // ACTIVE && (endsAt == null || endsAt > now)
  const activeWhere: Prisma.UserSanctionWhereInput = {
    userId,
    status: UserSanctionStatus.ACTIVE,
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  };

  const [activeSanctions, recentSanctions, sanctionsTotal, recentActions] = await prisma.$transaction([
    prisma.userSanction.findMany({
      where: activeWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        status: true,
        reason: true,
        message: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        createdById: true,
      },
    }),

    prisma.userSanction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        reason: true,
        message: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        createdById: true,
        liftedAt: true,
        liftedById: true,
        liftReason: true,
      },
    }),

    prisma.userSanction.count({ where: { userId } }),

    prisma.moderationAction.findMany({
      where: {
        targetType: ModerationTargetType.USER,
        targetId: String(userId),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: { select: { id: true, username: true, role: true } },
      },
    }),
  ]);

  const isBanned = activeSanctions.some(
    (s) => s.type === UserSanctionType.TEMP_BAN || s.type === UserSanctionType.PERM_BAN,
  );
  const isRestricted = activeSanctions.some((s) => s.type === UserSanctionType.RESTRICT);

  const lastSanctionAt = recentSanctions.length ? recentSanctions[0].createdAt : null;

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: String(user.role),
      desc: user.desc ?? null,
      profilePicture: user.profilePicture ?? null,
      coverPicture: user.coverPicture ?? null,
      from: user.from ?? null,
      city: user.city ?? null,
      relationship: user.relationship ?? null,
    },
    activeSanctions: activeSanctions.map((s) => ({
      id: s.id,
      type: String(s.type),
      status: String(s.status),
      reason: s.reason,
      message: s.message ?? null,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      createdAt: s.createdAt,
      createdById: s.createdById,
    })),
    recentSanctions: recentSanctions.map((s) => ({
      id: s.id,
      type: String(s.type),
      status: String(s.status),
      reason: s.reason,
      message: s.message ?? null,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      createdAt: s.createdAt,
      createdById: s.createdById,
      liftedAt: s.liftedAt,
      liftedById: s.liftedById,
      liftReason: s.liftReason,
    })),
    sanctionsSummary: {
      total: sanctionsTotal,
      active: activeSanctions.length,
      isBanned,
      isRestricted,
      lastSanctionAt,
    },
    recentActions: recentActions.map((a) => ({
      id: a.id,
      actionType: String(a.actionType),
      targetType: String(a.targetType),
      targetId: a.targetId,
      reason: a.reason ?? null,
      createdAt: a.createdAt,
      actor: a.actor
        ? { id: a.actor.id, username: a.actor.username, role: String(a.actor.role) }
        : null,
    })),
  };
}