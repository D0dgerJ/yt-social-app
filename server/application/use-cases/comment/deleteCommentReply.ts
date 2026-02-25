import prisma from "../../../infrastructure/database/prismaClient.ts";
import { CommentStatus, ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertCommentThreadActionAllowed } from "../../services/comment/assertCommentThreadActionAllowed.ts";

export const deleteCommentReply = async (params: { commentId: number; actorId: number; reason?: string }) => {
  const { commentId, actorId, reason } = params;

  if (!Number.isFinite(commentId) || commentId <= 0) {
    throw Errors.validation("Invalid commentId");
  }

  // ✅ thread auto-lock + shadow rules
  await assertCommentThreadActionAllowed({ commentId, actorId });

  const reply = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: { not: null },
      post: { status: ContentStatus.ACTIVE },
    },
    select: { id: true, status: true },
  });

  if (!reply) throw Errors.notFound("Comment does not exist.");

  if (reply.status === CommentStatus.DELETED) return { ok: true };

  if (reply.status !== CommentStatus.ACTIVE) {
    throw Errors.validation("Cannot delete non-active reply");
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.DELETED,
      deletedAt: new Date(),
      deletedById: actorId,
      deletedReason: reason ?? "Deleted by user",

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

  return { ok: true };
};