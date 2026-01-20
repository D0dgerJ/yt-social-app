import { ContentStatus, ModerationActionType, ModerationTargetType } from "@prisma/client";
import prisma from "../../../infrastructure/database/prismaClient.ts";
import { logModerationAction } from "./logModerationAction.ts";

type ModeratePostInput = {
  actorId: number;
  postId: number;
  reason?: string;
};

export async function hidePost({ actorId, postId, reason }: ModeratePostInput) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      status: ContentStatus.HIDDEN,
      hiddenAt: new Date(),
      hiddenById: actorId,
      hiddenReason: reason ?? null,
    },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_HIDDEN,
    targetType: ModerationTargetType.POST,
    targetId: String(postId),
    reason: reason ?? null,
    metadata: { mode: "hide" },
  });

  return post;
}

export async function unhidePost({ actorId, postId, reason }: ModeratePostInput) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      status: ContentStatus.ACTIVE,

      // Вариант A: чистим hidden-поля, чтобы не было “хвостов”
      hiddenAt: null,
      hiddenById: null,
      hiddenReason: null,
    },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_UNHIDDEN,
    targetType: ModerationTargetType.POST,
    targetId: String(postId),
    reason: reason ?? null,
    metadata: { mode: "unhide" },
  });

  return post;
}

export async function softDeletePost({ actorId, postId, reason }: ModeratePostInput) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      status: ContentStatus.DELETED,
      deletedAt: new Date(),
      deletedById: actorId,
      deletedReason: reason ?? null,
    },
  });

  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_DELETED,
    targetType: ModerationTargetType.POST,
    targetId: String(postId),
    reason: reason ?? null,
    metadata: { mode: "soft" },
  });

  return post;
}

/**
 * HARD DELETE:
 * - удаляем: post + comments + commentLikes + likes + savedPosts
 * - перед удалением сохраняем снапшот в ModerationAction.metadata
 */
export async function hardDeletePost({ actorId, postId, reason }: ModeratePostInput) {
  // Сначала читаем снапшот (чтобы если что — остался след)
  const postSnapshot = await prisma.post.findUnique({
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

  if (!postSnapshot) {
    // чтобы роут поймал как 404 по P2025 — можно кинуть свою ошибку
    const err = new Error("Post not found");
    // @ts-expect-error - добавляем код как у Prisma
    err.code = "P2025";
    throw err;
  }

  // Идём транзакцией, чтобы не было “полу-удалений”
  const result = await prisma.$transaction(async (tx) => {
    // собираем ids комментов (для удаления commentLike)
    const comments = await tx.comment.findMany({
      where: { postId },
      select: { id: true },
    });

    const commentIds = comments.map((c) => c.id);

    if (commentIds.length > 0) {
      await tx.commentLike.deleteMany({
        where: { commentId: { in: commentIds } },
      });
    }

    await tx.comment.deleteMany({ where: { postId } });
    await tx.like.deleteMany({ where: { postId } });
    await tx.savedPost.deleteMany({ where: { postId } });

    // сам пост
    await tx.post.delete({ where: { id: postId } });

    return { deleted: true, postId };
  });

  // Логируем ПОСЛЕ удаления — так всегда будет запись, даже если контент удалён
  await logModerationAction({
    actorId,
    actionType: ModerationActionType.CONTENT_DELETED,
    targetType: ModerationTargetType.POST,
    targetId: String(postId),
    reason: reason ?? null,
    metadata: {
      mode: "hard",
      snapshot: postSnapshot,
    },
  });

  return result;
}
