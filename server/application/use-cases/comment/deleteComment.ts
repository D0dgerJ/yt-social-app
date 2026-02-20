import prisma from "../../../infrastructure/database/prismaClient.ts";
import { CommentStatus, ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export const deleteComment = async (params: {
  commentId: number;
  actorId: number;
  reason?: string;
}) => {
  const { commentId, actorId, reason } = params;

  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: null,
      post: { status: ContentStatus.ACTIVE },
    },
    select: { id: true, status: true },
  });

  if (!comment) {
    throw Errors.notFound("Comment does not exist.");
  }

  // идемпотентность
  if (comment.status === CommentStatus.DELETED) {
    return { ok: true };
  }

  const now = new Date();
  const deleteReason = reason ?? "Deleted by user";

  await prisma.$transaction(async (tx) => {
    // 1️⃣ soft delete replies
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
      },
    });

    // 2️⃣ soft delete root comment
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
      },
      select: { id: true },
    });
  });

  return { ok: true };
};