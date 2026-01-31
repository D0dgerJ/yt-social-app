import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { logModerationAction } from "./logModerationAction.ts";
import { ModerationActionType, ModerationTargetType } from "@prisma/client";

type HardDeletePostInput = {
  actorId: number;
  postId: number;
  reason?: string;
};

async function userRef(userId: number | null) {
  if (!userId) return null;

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });

  return u ? { id: u.id, username: u.username } : { id: userId };
}

export async function hardDeletePost({ actorId, postId, reason }: HardDeletePostInput) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      userId: true,
      desc: true,
      images: true,
      videos: true,
      files: true,
      tags: true,
      location: true,
      status: true,
      createdAt: true,
      updatedAt: true,

      hiddenAt: true,
      hiddenById: true,
      hiddenReason: true,

      deletedAt: true,
      deletedById: true,
      deletedReason: true,
    },
  });

  // Если пост уже физически удалён — пытаемся вернуть "уже обработано" через outbox
  if (!post) {
    const outbox = await prisma.moderationOutbox.findFirst({
      where: {
        entityType: "POST",
        entityId: String(postId),
        eventType: "POST_ADMIN_HARD_DELETE",
      },
      orderBy: { createdAt: "desc" },
    });

    const deletedByAdminId = (outbox as any)?.payload?.deletedByAdminId ?? null;
    const deletedAt = (outbox as any)?.payload?.deletedAt ?? outbox?.createdAt ?? null;
    const outReason = (outbox as any)?.payload?.reason ?? null;

    if (outbox) {
      throw Errors.conflict("Post already hard-deleted", {
        already: {
          actionType: "CONTENT_DELETED",
          actor: await userRef(deletedByAdminId),
          at: deletedAt,
          reason: outReason,
        },
      });
    }

    throw Errors.notFound("Post not found");
  }

  // Если пост уже soft-deleted — не даём “второй раз”
  if (post.status === "DELETED") {
    throw Errors.conflict("Post already deleted", {
      already: {
        actionType: "CONTENT_DELETED",
        actor: await userRef(post.deletedById),
        at: post.deletedAt,
        reason: post.deletedReason,
      },
    });
  }

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_DELETED,
    targetType: ModerationTargetType.POST,
    targetId: String(post.id),
    reason: reason ?? null,
    metadata: { mode: "hard" },
  });

  await prisma.$transaction(async (tx) => {
    // outbox snapshot
    await tx.moderationOutbox.create({
      data: {
        eventType: "POST_ADMIN_HARD_DELETE",
        entityType: "POST",
        entityId: String(post.id),
        payload: {
          postSnapshot: post,
          reason: reason ?? null,
          deletedByAdminId: actorId,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    await tx.commentLike.deleteMany({
      where: { comment: { postId: post.id } },
    });

    await tx.comment.deleteMany({
      where: { postId: post.id },
    });

    await tx.like.deleteMany({
      where: { postId: post.id },
    });

    await tx.savedPost.deleteMany({
      where: { postId: post.id },
    });

    await tx.post.delete({
      where: { id: post.id },
    });
  });

  return { postId: post.id };
}
