import { ModerationActionType, ModerationTargetType, Prisma } from '@prisma/client';
import prisma from '../../../infrastructure/database/prismaClient.ts';

type LogModerationActionInput = {
  actorId?: number | null;
  actionType: ModerationActionType;
  targetType: ModerationTargetType;
  targetId: string | number;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export async function logModerationAction(input: LogModerationActionInput) {
  const { actorId, actionType, targetType, targetId, reason, metadata } = input;

  return prisma.moderationAction.create({
    data: {
      actorId: actorId ?? null,
      actionType,
      targetType,
      targetId: String(targetId),
      reason: reason ?? null,
      metadata: metadata ?? undefined,
    },
  });
}