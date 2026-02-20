import prisma from "../../../infrastructure/database/prismaClient.ts";
import { CommentStatus, ContentStatus } from "@prisma/client";

function sanitizeDeletedComment<
  T extends { status: CommentStatus; content?: string; images?: string[]; videos?: string[]; files?: string[] }
>(c: T): T {
  if (c.status !== CommentStatus.DELETED) return c;

  return {
    ...c,
    content: "(deleted)",
    images: [],
    videos: [],
    files: [],
  };
}

export const getCommentById = async (commentId: number) => {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      // Показываем ACTIVE и DELETED, но НЕ HIDDEN
      status: { in: [CommentStatus.ACTIVE, CommentStatus.DELETED] },
      post: { status: ContentStatus.ACTIVE },
    },
    include: {
      user: { select: { id: true, username: true, profilePicture: true } },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
  });

  return comment ? sanitizeDeletedComment(comment as any) : null;
};