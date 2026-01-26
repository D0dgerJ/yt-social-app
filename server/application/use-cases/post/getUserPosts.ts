import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export const getUserPosts = async (userId: number) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  return prisma.post.findMany({
    where: { userId, status: ContentStatus.ACTIVE },
    orderBy: { createdAt: "desc" },
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
};
