import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { ModerationActionType, ModerationTargetType, ReportStatus } from "@prisma/client";
import { logModerationAction } from "./logModerationAction.js";

export const approveCommentReport = async (params: { actorId: number; reportId: number; reason: string }) => {
  const { actorId, reportId, reason } = params;

  const report = await prisma.commentReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, commentId: true },
  });

  if (!report) throw Errors.notFound("Report not found");
  if (report.status !== ReportStatus.PENDING) throw Errors.validation("Report already reviewed");

  const updated = await prisma.commentReport.update({
    where: { id: reportId },
    data: {
      status: ReportStatus.APPROVED,
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
    select: { id: true, status: true, reviewedAt: true, commentId: true },
  });

  const commentOwner = await prisma.comment.findUnique({
    where: { id: report.commentId },
    select: { userId: true },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.NOTE,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(report.commentId),
    subjectUserId: commentOwner?.userId ?? null,
    reason,
    metadata: { reportId, decision: "APPROVED" },
  });

  return updated;
};

export const rejectCommentReport = async (params: { actorId: number; reportId: number; reason: string }) => {
  const { actorId, reportId, reason } = params;

  const report = await prisma.commentReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, commentId: true },
  });

  if (!report) throw Errors.notFound("Report not found");
  if (report.status !== ReportStatus.PENDING) throw Errors.validation("Report already reviewed");

  const updated = await prisma.commentReport.update({
    where: { id: reportId },
    data: {
      status: ReportStatus.REJECTED,
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
    select: { id: true, status: true, reviewedAt: true, commentId: true },
  });

  const commentOwner = await prisma.comment.findUnique({
    where: { id: report.commentId },
    select: { userId: true },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.NOTE,
    targetType: ModerationTargetType.COMMENT,
    targetId: String(report.commentId),
    subjectUserId: commentOwner?.userId ?? null,
    reason,
    metadata: { reportId, decision: "REJECTED" },
  });

  return updated;
};