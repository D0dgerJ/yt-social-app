import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import {
  CommentStatus,
  ModerationActionType,
  ModerationTargetType,
} from "@prisma/client";
import { assertApprovedCommentReport } from "./assertApprovedReport.ts";

export const hideComment = async (params: {
  actorId: number;
  commentId: number;
  reason: string;
}) => {
  const { actorId, commentId, reason } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED)
    throw Errors.validation("Comment is deleted");
  if (comment.status === CommentStatus.HIDDEN)
    throw Errors.validation("Comment is already hidden");

  await assertApprovedCommentReport(commentId);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.HIDDEN,
      hiddenAt: new Date(),
      hiddenById: actorId,
      hiddenReason: reason,
    },
    select: { id: true, status: true, hiddenAt: true },
  });

  await prisma.moderationAction.create({
    data: {
      actorId,
      actionType: ModerationActionType.CONTENT_HIDDEN,
      targetType: ModerationTargetType.COMMENT,
      targetId: String(commentId),
      reason,
    },
  });

  return updated;
};

export const unhideComment = async (params: {
  actorId: number;
  commentId: number;
  reason: string;
}) => {
  const { actorId, commentId, reason } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED)
    throw Errors.validation("Comment is deleted");
  if (comment.status !== CommentStatus.HIDDEN)
    throw Errors.validation("Comment is not hidden");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.ACTIVE,
      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    },
    select: { id: true, status: true },
  });

  await prisma.moderationAction.create({
    data: {
      actorId,
      actionType: ModerationActionType.CONTENT_UNHIDDEN,
      targetType: ModerationTargetType.COMMENT,
      targetId: String(commentId),
      reason,
    },
  });

  return updated;
};

/**
 * Soft-delete comment by moderator.
 * Requires at least one APPROVED report (same rule as hide/unhide flow).
 */
export const softDeleteComment = async (params: {
  actorId: number;
  commentId: number;
  reason: string;
}) => {
  const { actorId, commentId, reason } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED)
    throw Errors.validation("Comment is already deleted");

  await assertApprovedCommentReport(commentId);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.DELETED,
      deletedAt: new Date(),
      deletedById: actorId,
      deletedReason: reason,

      // Если было HIDDEN — очищаем hidden-поля, чтобы статус был однозначным
      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    },
    select: { id: true, status: true, deletedAt: true },
  });

  await prisma.moderationAction.create({
    data: {
      actorId,
      actionType: ModerationActionType.CONTENT_DELETED,
      targetType: ModerationTargetType.COMMENT,
      targetId: String(commentId),
      reason,
    },
  });

  return updated;
};

/**
 * Restore soft-deleted comment back to ACTIVE by moderator.
 */
export const restoreDeletedComment = async (params: {
  actorId: number;
  commentId: number;
  reason: string;
}) => {
  const { actorId, commentId, reason } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status !== CommentStatus.DELETED)
    throw Errors.validation("Comment is not deleted");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.ACTIVE,
      deletedAt: null,
      deletedById: null,
      deletedReason: null,
    },
    select: { id: true, status: true },
  });

  await prisma.moderationAction.create({
    data: {
      actorId,
      actionType: ModerationActionType.NOTE,
      targetType: ModerationTargetType.COMMENT,
      targetId: String(commentId),
      reason: `Restored deleted comment. ${reason}`,
    },
  });

  return updated;
};