import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

export const getFeedPosts = async (userId: number) => {
  if (!Number.isFinite(userId) || userId <= 0) {
    throw Errors.validation("Invalid userId");
  }

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  return prisma.post.findMany({
    where: {
      status: ContentStatus.ACTIVE,
      OR: [{ userId }, { userId: { in: followingIds } }],
    },
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

      _count: {
        select: { likes: true, comments: true },
      },
    },
  });
};