import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { ContentStatus, ModerationActionType, ModerationTargetType, ReportStatus } from "@prisma/client";
import { logModerationAction } from "../../services/moderation/logModerationAction.ts";

type ReportPostInput = {
  postId: number;
  reporterId: number;
  reason: string;
  message?: string;
};

const ALLOWED_REASONS = new Set([
  "spam",
  "abuse",
  "harassment",
  "hate",
  "violence",
  "nudity",
  "scam",
  "other",
]);

export async function reportPost({ postId, reporterId, reason, message }: ReportPostInput) {
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");
  if (!Number.isFinite(reporterId) || reporterId <= 0) throw Errors.validation("Invalid reporterId");

  const cleanReason = String(reason ?? "").trim().toLowerCase();
  if (!cleanReason) throw Errors.validation("Reason is required");
  if (!ALLOWED_REASONS.has(cleanReason)) {
    throw Errors.validation("Invalid reason", { allowed: Array.from(ALLOWED_REASONS) });
  }

  const cleanMessage = typeof message === "string" ? message.trim() : "";
  if (cleanMessage.length > 1000) throw Errors.validation("Message is too long (max 1000)");

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, status: true, userId: true },
  });

  if (!post) throw Errors.notFound("Post not found");

  if (post.userId === reporterId) {
    throw Errors.forbidden("You cannot report your own post");
  }

  if (post.status === ContentStatus.HIDDEN) throw Errors.postHidden();
  if (post.status === ContentStatus.DELETED) throw Errors.postDeleted();

  try {
    const created = await prisma.postReport.create({
      data: {
        postId,
        reporterId,
        reason: cleanReason,
        message: cleanMessage || null,
        status: ReportStatus.PENDING,
      },
    });

    await logModerationAction({
      actorId: reporterId,
      actionType: ModerationActionType.REPORT_CREATED,
      targetType: ModerationTargetType.POST,
      targetId: String(postId),
      reason: cleanReason,
      metadata: {
        message: cleanMessage || undefined,
        postOwnerId: post.userId,
        postStatus: post.status,
      },
    });

    return { ok: true, report: created };
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };

    // @@unique([postId, reporterId]) -> повторная жалоба
    if (err.code === "P2002") {
      return { ok: true, alreadyReported: true };
    }

    throw error;
  }
}
