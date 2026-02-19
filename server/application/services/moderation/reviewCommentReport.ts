import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { ModerationActionType, ModerationTargetType } from "@prisma/client";

export const approveCommentReport = async (params: { actorId: number; reportId: number; reason: string }) => {
  const { actorId, reportId, reason } = params;

  const report = await prisma.commentReport.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, commentId: true },
  });

  if (!report) throw Errors.notFound("Report not found");
  if (report.status !== "PENDING") throw Errors.validation("Report already reviewed");

  const updated = await prisma.commentReport.update({
    where: { id: reportId },
    data: {
      status: "APPROVED",
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
    select: { id: true, status: true, reviewedAt: true },
  });

  await prisma.moderationAction.create({
    data: {
      actorId,
      actionType: ModerationActionType.NOTE,
      targetType: ModerationTargetType.COMMENT,
      targetId: String(report.commentId),
      reason,
      metadata: { reportId, decision: "APPROVED" },
    },
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
  if (report.status !== "PENDING") throw Errors.validation("Report already reviewed");

  const updated = await prisma.commentReport.update({
    where: { id: reportId },
    data: {
      status: "REJECTED",
      reviewedById: actorId,
      reviewedAt: new Date(),
    },
    select: { id: true, status: true, reviewedAt: true },
  });

  await prisma.moderationAction.create({
    data: {
      actorId,
      actionType: ModerationActionType.NOTE,
      targetType: ModerationTargetType.COMMENT,
      targetId: String(report.commentId),
      reason,
      metadata: { reportId, decision: "REJECTED" },
    },
  });

  return updated;
};
