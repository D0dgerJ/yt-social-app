import prisma from "../../../infrastructure/database/prismaClient.ts";
import { logModerationAction } from "./logModerationAction.ts";
import { ModerationActionType, ModerationTargetType, UserSanctionStatus, UserSanctionType } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

type ApplyUserSanctionInput = {
  actorId: number;
  userId: number;
  type: UserSanctionType;
  reason: string;
  message?: string;
  evidence?: unknown;
  endsAt?: Date | null;
};

function mapActionType(type: UserSanctionType): ModerationActionType {
  if (type === UserSanctionType.RESTRICT) return ModerationActionType.USER_RESTRICTED;
  if (type === UserSanctionType.TEMP_BAN) return ModerationActionType.USER_BANNED;
  if (type === UserSanctionType.PERM_BAN) return ModerationActionType.USER_BANNED;
  return ModerationActionType.NOTE;
}

export async function applyUserSanction(input: ApplyUserSanctionInput) {
  const { actorId, userId, type, reason, message, evidence, endsAt } = input;

  const now = new Date();

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) throw Errors.notFound("User not found");

  // Единая логика "активной" санкции:
  // ACTIVE && (endsAt == null || endsAt > now)
  const existing = await prisma.userSanction.findFirst({
    where: {
      userId,
      status: UserSanctionStatus.ACTIVE,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      type: { in: [UserSanctionType.RESTRICT, UserSanctionType.TEMP_BAN, UserSanctionType.PERM_BAN] },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, endsAt: true },
  });

  if (
    existing &&
    (type === UserSanctionType.RESTRICT || type === UserSanctionType.TEMP_BAN || type === UserSanctionType.PERM_BAN)
  ) {
    throw Errors.conflict("User already has an active sanction", {
      existingSanctionId: existing.id,
      existingType: existing.type,
      existingEndsAt: existing.endsAt?.toISOString() ?? null,
    });
  }

  if (type === UserSanctionType.TEMP_BAN && !endsAt) {
    throw Errors.validation("endsAt is required for TEMP_BAN");
  }

  if ((type === UserSanctionType.TEMP_BAN || type === UserSanctionType.RESTRICT) && endsAt && endsAt <= now) {
    throw Errors.validation("endsAt must be in the future");
  }

  const sanction = await prisma.userSanction.create({
    data: {
      userId,
      type,
      status: UserSanctionStatus.ACTIVE,
      reason,
      message: message ?? null,
      evidence: evidence ?? undefined,
      endsAt: endsAt ?? null,
      createdById: actorId,
    },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      reason: true,
      message: true,
      evidence: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
      createdById: true,
    },
  });

  await logModerationAction({
    actorId,
    actionType: mapActionType(type),
    targetType: ModerationTargetType.USER,
    targetId: String(userId),
    reason,
    metadata: {
      sanctionId: sanction.id,
      type: sanction.type,
      endsAt: sanction.endsAt?.toISOString() ?? null,
      message: message ?? null,
      evidence: evidence ?? null,
    },
  });

  return sanction;
}