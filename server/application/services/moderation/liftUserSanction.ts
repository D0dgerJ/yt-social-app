import prisma from "../../../infrastructure/database/prismaClient.ts";
import { logModerationAction } from "./logModerationAction.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { ModerationActionType, ModerationTargetType, UserSanctionStatus, UserSanctionType } from "@prisma/client";

type LiftUserSanctionInput = {
  actorId: number;
  sanctionId: number;
  liftReason: string;
};

function mapLiftActionType(type: UserSanctionType): ModerationActionType {
  if (type === UserSanctionType.RESTRICT) return ModerationActionType.USER_UNRESTRICTED;
  if (type === UserSanctionType.TEMP_BAN) return ModerationActionType.USER_UNBANNED;
  if (type === UserSanctionType.PERM_BAN) return ModerationActionType.USER_UNBANNED;
  return ModerationActionType.NOTE; 
}

export async function liftUserSanction({ actorId, sanctionId, liftReason }: LiftUserSanctionInput) {
  const sanction = await prisma.userSanction.findUnique({
    where: { id: sanctionId },
    select: { id: true, userId: true, type: true, status: true },
  });

  if (!sanction) throw Errors.notFound("Sanction not found");
  if (sanction.status !== UserSanctionStatus.ACTIVE) throw Errors.conflict("Sanction is not active");

  const updated = await prisma.userSanction.update({
    where: { id: sanctionId },
    data: {
      status: UserSanctionStatus.LIFTED,
      liftedAt: new Date(),
      liftedById: actorId,
      liftReason,
    },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      reason: true,
      endsAt: true,
      liftedAt: true,
      liftedById: true,
      liftReason: true,
    },
  });

  await logModerationAction({
    actorId,
    actionType: mapLiftActionType(sanction.type),
    targetType: ModerationTargetType.USER,
    targetId: String(sanction.userId),
    reason: liftReason,
    metadata: {
      sanctionId: updated.id,
      type: updated.type,
      previousReason: updated.reason ?? null,
      endsAt: updated.endsAt?.toISOString() ?? null,
    },
  });

  return updated;
}
