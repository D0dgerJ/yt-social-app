import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import {
  CommentStatus,
  CommentVisibility,
  ModerationActionType,
  ModerationTargetType,
} from "@prisma/client";
import { assertApprovedCommentReport } from "./assertApprovedReport.js";
import { logModerationAction } from "./logModerationAction.js";

export const hideComment = async (params: {
  actorId: number;
  commentId: number;
  reason: string;
}) => {
  const { actorId, commentId, reason } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true, userId: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED) throw Errors.validation("Comment is deleted");
  if (comment.status === CommentStatus.HIDDEN) throw Errors.validation("Comment is already hidden");

  await assertApprovedCommentReport(commentId);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.HIDDEN,
      hiddenAt: new Date(),
      hiddenById: actorId,
      hiddenReason: reason,

      visibility: CommentVisibility.PUBLIC,
      shadowHiddenAt: null,
      shadowHiddenById: null,
      shadowHiddenReason: null,
    },
    select: { id: true, status: true, hiddenAt: true },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_HIDDEN,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(commentId),
    subjectUserId: comment.userId,
    reason,
    metadata: { mode: "hide" },
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
    select: { id: true, status: true, userId: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED) throw Errors.validation("Comment is deleted");
  if (comment.status !== CommentStatus.HIDDEN) throw Errors.validation("Comment is not hidden");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.ACTIVE,
      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,

      visibility: CommentVisibility.PUBLIC,
      shadowHiddenAt: null,
      shadowHiddenById: null,
      shadowHiddenReason: null,
    },
    select: { id: true, status: true },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_UNHIDDEN,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(commentId),
    subjectUserId: comment.userId,
    reason,
    metadata: { mode: "unhide" },
  });

  return updated;
};

export const shadowHideComment = async (params: {
  actorId: number;
  commentId: number;
  reason: string;
}) => {
  const { actorId, commentId, reason } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true, visibility: true, userId: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED) throw Errors.validation("Comment is deleted");
  if (comment.visibility === CommentVisibility.SHADOW_HIDDEN) {
    throw Errors.validation("Comment is already shadow hidden");
  }

  await assertApprovedCommentReport(commentId);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      visibility: CommentVisibility.SHADOW_HIDDEN,
      shadowHiddenAt: new Date(),
      shadowHiddenById: actorId,
      shadowHiddenReason: reason,

      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    },
    select: { id: true, status: true, visibility: true, shadowHiddenAt: true },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_SHADOW_HIDDEN,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(commentId),
    subjectUserId: comment.userId,
    reason,
    metadata: { mode: "shadow_hide" },
  });

  return updated;
};

export const shadowUnhideComment = async (params: {
  actorId: number;
  commentId: number;
  reason: string;
}) => {
  const { actorId, commentId, reason } = params;

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, status: true, visibility: true, userId: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED) throw Errors.validation("Comment is deleted");
  if (comment.visibility !== CommentVisibility.SHADOW_HIDDEN) {
    throw Errors.validation("Comment is not shadow hidden");
  }

  await assertApprovedCommentReport(commentId);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      visibility: CommentVisibility.PUBLIC,
      shadowHiddenAt: null,
      shadowHiddenById: null,
      shadowHiddenReason: null,

      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    },
    select: { id: true, status: true, visibility: true },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_SHADOW_UNHIDDEN,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(commentId),
    subjectUserId: comment.userId,
    reason,
    metadata: { mode: "shadow_unhide" },
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
    select: { id: true, status: true, userId: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status === CommentStatus.DELETED) throw Errors.validation("Comment is already deleted");

  await assertApprovedCommentReport(commentId);

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: {
      status: CommentStatus.DELETED,
      deletedAt: new Date(),
      deletedById: actorId,
      deletedReason: reason,

      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,

      visibility: CommentVisibility.PUBLIC,
      shadowHiddenAt: null,
      shadowHiddenById: null,
      shadowHiddenReason: null,
    },
    select: { id: true, status: true, deletedAt: true },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_DELETED,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(commentId),
    subjectUserId: comment.userId,
    reason,
    metadata: { mode: "soft_delete" },
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
    select: { id: true, status: true, userId: true },
  });

  if (!comment) throw Errors.notFound("Comment not found");
  if (comment.status !== CommentStatus.DELETED) throw Errors.validation("Comment is not deleted");

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

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.NOTE,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(commentId),
    subjectUserId: comment.userId,
    reason: `Restored deleted comment. ${reason}`,
    metadata: { mode: "restore" },
  });

  return updated;
};