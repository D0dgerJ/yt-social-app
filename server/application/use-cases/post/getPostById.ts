import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export const getPostById = async (postId: number) => {
  if (!Number.isFinite(postId) || postId <= 0) {
    throw Errors.validation("Invalid postId");
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, status: ContentStatus.ACTIVE },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      likes: { select: { userId: true } },
      savedBy: { select: { userId: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) {
    throw Errors.notFound("Post not found");
  }

  return post;
};
