import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { UserRole } from "@prisma/client";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";

export const deleteUser = async (params: { actorId: number; userId: number }) => {
  const { actorId, userId } = params;

  if (!Number.isFinite(actorId) || actorId <= 0) throw Errors.validation("Invalid actorId");
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

  await assertUserActionAllowed({ userId: actorId, forbidRestricted: true });

  // owner can delete self
  if (actorId !== userId) {
    const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
    if (!actor) throw Errors.unauthorized("Unauthorized");

    const isStaff =
      actor.role === UserRole.MODERATOR ||
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.OWNER;

    if (!isStaff) throw Errors.forbidden("You cannot delete this user");
  }

  await prisma.user.delete({ where: { id: userId } });
  return { ok: true };
};