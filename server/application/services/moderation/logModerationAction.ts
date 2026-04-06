import { ModerationActionType, ModerationTargetType, Prisma } from "@prisma/client";
import prisma from "../../../infrastructure/database/prismaClient.js";

type LogModerationActionInput = {
  actorId?: number | null;

  actionType: ModerationActionType;
  targetType: ModerationTargetType;
  targetId: string | number;

  /**
   * escalation history anchor:
   * user that this action is "about" (owner of content or target user)
   */
  subjectUserId?: number | null;

  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function logModerationAction(input: LogModerationActionInput) {
  const { actorId, actionType, targetType, targetId, subjectUserId, reason, metadata } = input;

  return prisma.moderationAction.create({
    data: {
      actorId: actorId ?? null,
      actionType,
      targetType,
      targetId: String(targetId),

      subjectUserId: subjectUserId ?? null,

      reason: reason ?? null,
      metadata: metadata ?? undefined,
    },
  });
}