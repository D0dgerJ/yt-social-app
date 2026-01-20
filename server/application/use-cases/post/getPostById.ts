import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

export const getPostById = async (postId: number) => {
  if (!postId || Number.isNaN(postId)) {
    throw new Error("Invalid or missing postId");
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, status: ContentStatus.ACTIVE },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
      _count: { select: { likes: true } },
    },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  return post;
};