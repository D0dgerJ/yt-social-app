import prisma from "../../../infrastructure/database/prismaClient.ts";
import { CommentStatus, ContentStatus, UserRole } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";

export const deleteComment = async (params: {
  commentId: number;
  actorId: number;
  reason?: string;
}) => {
  const { commentId, actorId, reason } = params;

  if (!Number.isFinite(commentId) || commentId <= 0) {
    throw Errors.validation("Invalid commentId");
  }
  if (!Number.isFinite(actorId) || actorId <= 0) {
    throw Errors.validation("Invalid actorId");
  }

  // ban/restrict enforcement в домене
  await assertUserActionAllowed({ userId: actorId, forbidRestricted: true });

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: null, // удаляем только root (как и было)
      post: { status: ContentStatus.ACTIVE },
    },
    select: { id: true, status: true, userId: true },
  });

  if (!comment) {
    throw Errors.notFound("Comment does not exist.");
  }

  // идемпотентность
  if (comment.status === CommentStatus.DELETED) {
    return { ok: true };
  }

  // Проверка прав:
  // - владелец может удалить свой комментарий
  // - staff (MODERATOR/ADMIN/OWNER) может удалить любой (через админ-модерацию)
  if (comment.userId !== actorId) {
    const actor = await prisma.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });

    if (!actor) throw Errors.unauthorized("Unauthorized");

    const isStaff =
      actor.role === UserRole.MODERATOR ||
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.OWNER;

    if (!isStaff) {
      throw Errors.forbidden("You cannot delete this comment");
    }
  }

  const now = new Date();
  const deleteReason = reason ?? "Deleted";

  await prisma.$transaction(async (tx) => {
    // 1) soft delete replies
    await tx.comment.updateMany({
      where: {
        parentId: commentId,
        status: { not: CommentStatus.DELETED },
      },
      data: {
        status: CommentStatus.DELETED,
        deletedAt: now,
        deletedById: actorId,
        deletedReason: deleteReason,

        hiddenAt: null,
        hiddenById: null,
        hiddenReason: null,

        visibility: "PUBLIC",
        shadowHiddenAt: null,
        shadowHiddenById: null,
        shadowHiddenReason: null,
      },
    });

    // 2) soft delete root comment
    await tx.comment.update({
      where: { id: commentId },
      data: {
        status: CommentStatus.DELETED,
        deletedAt: now,
        deletedById: actorId,
        deletedReason: deleteReason,

        hiddenAt: null,
        hiddenById: null,
        hiddenReason: null,

        visibility: "PUBLIC",
        shadowHiddenAt: null,
        shadowHiddenById: null,
        shadowHiddenReason: null,
      },
      select: { id: true },
    });
  });

  return { ok: true };
};