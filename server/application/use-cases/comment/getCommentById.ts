import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

export const getCommentById = async (commentId: number) => {
  return prisma.comment.findFirst({
    where: {
      id: commentId,
      post: { status: ContentStatus.ACTIVE },
    },
    include: {
      user: {
        select: { id: true, username: true, profilePicture: true },
      },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
  });
};
