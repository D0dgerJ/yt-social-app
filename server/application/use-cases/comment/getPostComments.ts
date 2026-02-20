import prisma from "../../../infrastructure/database/prismaClient.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { CommentStatus } from "@prisma/client";

function sanitizeDeletedComment<T extends { status: CommentStatus; content?: string; images?: string[]; videos?: string[]; files?: string[] }>(
  c: T
): T {
  if (c.status !== CommentStatus.DELETED) return c;

  return {
    ...c,
    content: "(deleted)",
    images: [],
    videos: [],
    files: [],
  };
}

export const getPostComments = async (postId: number) => {
  if (!postId || postId <= 0) {
    throw Errors.validation("Invalid post ID");
  }

  await assertPostActionAllowed(postId);

  const items = await prisma.comment.findMany({
    where: {
      postId,
      parentId: null,
      // Показываем ACTIVE и DELETED, но НЕ HIDDEN (скрытое модерацией не должно отображаться)
      status: { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
    },
    include: {
      user: {
        select: { id: true, username: true, profilePicture: true },
      },
      replies: {
        where: {
          status: { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
        },
        include: {
          user: {
            select: { id: true, username: true, profilePicture: true },
          },
          _count: { select: { likes: true } },
          likes: { select: { userId: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Санитизируем DELETED и для корней, и для replies
  return items.map((c) => ({
    ...sanitizeDeletedComment(c as any),
    replies: (c.replies ?? []).map((r: any) => sanitizeDeletedComment(r)),
  }));
};