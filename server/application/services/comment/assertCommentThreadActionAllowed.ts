import prisma from "../../../infrastructure/database/prismaClient.ts";
import { CommentStatus, ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

type Result = {
  rootId: number;
  rootStatus: CommentStatus;
  rootParentId: number | null;
  postId: number;
};

/**
 * Thread auto-lock:
 * - Если root-коммент НЕ ACTIVE (HIDDEN/DELETED) => обычным пользователям запрещаем действия в ветке.
 * - Также запрещаем, если пост не ACTIVE.
 *
 * ВАЖНО: это для "пользовательских" действий (create reply / like / update reply / delete reply).
 * Модераторские действия идут через /mod/* эндпоинты и отдельные сервисы.
 */
export async function assertCommentThreadActionAllowed(params: {
  commentId: number; // может быть root или reply
}): Promise<Result> {
  const { commentId } = params;

  const node = await prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      parentId: true,
      postId: true,
      post: { select: { status: true } },
    },
  });

  if (!node) throw Errors.notFound("Comment not found");

  // пост должен быть ACTIVE
  if (node.post.status !== ContentStatus.ACTIVE) {
    throw Errors.validation("Post is not active");
  }

  // root = либо сам commentId, либо parentId (у тебя 1 уровень replies)
  const rootId = node.parentId ?? node.id;

  // ✅ всегда забираем root из БД с одинаковым select => типы стабильные
  const root = await prisma.comment.findUnique({
    where: { id: rootId },
    select: { id: true, status: true, parentId: true, postId: true },
  });

  if (!root) throw Errors.notFound("Root comment not found");

  // Если root не ACTIVE — thread locked для user-действий
  if (root.status !== CommentStatus.ACTIVE) {
    throw Errors.validation("Comment thread is locked");
  }

  return {
    rootId: root.id,
    rootStatus: root.status,
    rootParentId: root.parentId ?? null,
    postId: root.postId,
  };
}