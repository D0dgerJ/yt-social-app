import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

export const getCommentReplies = async (commentId: number) => {
  return prisma.comment.findMany({
    where: {
      parentId: commentId,
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
};
