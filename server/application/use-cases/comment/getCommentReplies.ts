import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus, CommentStatus } from "@prisma/client";

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

export const getCommentReplies = async (commentId: number) => {
  const replies = await prisma.comment.findMany({
    where: {
      parentId: commentId,
      // Показываем ACTIVE и DELETED, но НЕ HIDDEN
      status: { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
      post: { status: ContentStatus.ACTIVE },
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, username: true, profilePicture: true },
      },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
  });

  return replies.map((r) => sanitizeDeletedComment(r as any));
};