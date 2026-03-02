import {
  CommentStatus,
  ModerationActionType,
  ModerationTargetType,
  ReportStatus,
} from "@prisma/client";
import prisma from "../../../infrastructure/database/prismaClient.ts";
import type { ReportCommentDto } from "../../../validation/commentSchemas.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";
import { logModerationAction } from "../../services/moderation/logModerationAction.ts";

type Params = {
  actorId: number;
  commentId: number;
  dto: ReportCommentDto;
};

export const reportComment = async ({ actorId, commentId, dto }: Params) => {
  if (!Number.isFinite(actorId) || actorId <= 0) throw Errors.validation("Invalid actorId");
  if (!Number.isFinite(commentId) || commentId <= 0) throw Errors.validation("Invalid commentId");

  // banned блокируем, restricted разрешаем репортить
  await assertUserActionAllowed({ userId: actorId, forbidRestricted: false });

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, status: true, postId: true },
  });

  if (!comment) {
    throw Errors.notFound("Comment not found");
  }

  if (comment.status !== CommentStatus.ACTIVE) {
    throw Errors.validation("You cannot report this comment");
  }

  if (comment.userId === actorId) {
    throw Errors.validation("You cannot report your own comment");
  }

  try {
    const created = await prisma.commentReport.create({
      data: {
        commentId: comment.id,
        reporterId: actorId,
        reason: dto.reason,
        details: dto.details,
        status: ReportStatus.PENDING,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    await logModerationAction({
      actorId,
      actionType: ModerationActionType.REPORT_CREATED,
      targetType: ModerationTargetType.COMMENT,
      targetId: String(comment.id),

      subjectUserId: comment.userId,

      reason: dto.reason,
      metadata: {
        commentId: comment.id,
        postId: comment.postId,
        reportId: created.id,
      },
    });

    return created;
  } catch (err: any) {
    if (err?.code === "P2002") {
      throw Errors.conflict("You have already reported this comment");
    }
    throw err;
  }
};