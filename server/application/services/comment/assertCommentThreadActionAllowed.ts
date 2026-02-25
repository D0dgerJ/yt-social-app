import prisma from "../../../infrastructure/database/prismaClient.ts";
import { CommentStatus, ContentStatus, CommentVisibility } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

type Result = {
  rootId: number;
  rootStatus: CommentStatus;
  rootParentId: number | null;
  postId: number;
};

/**
 * Thread auto-lock + shadow moderation:
 * - Если root НЕ ACTIVE => thread locked
 * - Если root SHADOW_HIDDEN => thread locked для всех, кроме автора root
 * - Если сам comment SHADOW_HIDDEN и actor не автор => 404 (не раскрываем наличие)
 * - Если пост не ACTIVE => запрещено
 */
export async function assertCommentThreadActionAllowed(params: {
  commentId: number; // может быть root или reply
  actorId?: number;  // кто делает user-действие (like/reply/update/delete reply)
}): Promise<Result> {
  const { commentId, actorId } = params;

  const node = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      parentId: true,
      postId: true,
      userId: true,
      status: true,
      visibility: true,
      post: { select: { status: true } },
    },
  });

  if (!node) throw Errors.notFound("Comment not found");

  // пост должен быть ACTIVE
  if (node.post.status !== ContentStatus.ACTIVE) {
    throw Errors.validation("Post is not active");
  }

  // Если конкретный comment SHADOW_HIDDEN и actor не автор => делаем вид что не существует
  if (node.visibility === CommentVisibility.SHADOW_HIDDEN && actorId && node.userId !== actorId) {
    throw Errors.notFound("Comment not found");
  }
  // Если actorId не передали (аноним/ошибка интеграции) — для user-действий это не должно происходить,
  // но безопаснее запретить
  if (node.visibility === CommentVisibility.SHADOW_HIDDEN && !actorId) {
    throw Errors.notFound("Comment not found");
  }

  const rootId = node.parentId ?? node.id;

  const root = await prisma.comment.findUnique({
    where: { id: rootId },
    select: { id: true, status: true, parentId: true, postId: true, userId: true, visibility: true },
  });

  if (!root) throw Errors.notFound("Root comment not found");

  // Если root не ACTIVE — thread locked
  if (root.status !== CommentStatus.ACTIVE) {
    throw Errors.validation("Comment thread is locked");
  }

  // Если root SHADOW_HIDDEN — thread locked для всех, кроме автора root
  if (root.visibility === CommentVisibility.SHADOW_HIDDEN) {
    if (!actorId || root.userId !== actorId) {
      throw Errors.validation("Comment thread is locked");
    }
  }

  return {
    rootId: root.id,
    rootStatus: root.status,
    rootParentId: root.parentId ?? null,
    postId: root.postId,
  };
}