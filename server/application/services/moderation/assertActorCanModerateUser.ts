import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { UserRole } from "@prisma/client";

const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
  OWNER: 3,
};

type Input = {
  actorId: number;
  targetUserId: number;
};

/**
 * Separation of power:
 * - запрет self-moderation
 * - actor должен быть строго выше target по роли
 */
export async function assertActorCanModerateUser({ actorId, targetUserId }: Input) {
  if (actorId === targetUserId) {
    throw Errors.forbidden("Self moderation is not allowed");
  }

  const [actor, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: actorId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: targetUserId }, select: { role: true } }),
  ]);

  if (!actor) throw Errors.unauthorized("Unauthorized");
  if (!target) throw Errors.notFound("User not found");

  const actorRank = ROLE_RANK[actor.role];
  const targetRank = ROLE_RANK[target.role];

  if (actorRank <= targetRank) {
    throw Errors.forbidden("Insufficient power to moderate this user", {
      actorRole: actor.role,
      targetRole: target.role,
    });
  }
}