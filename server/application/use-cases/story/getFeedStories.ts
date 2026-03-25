import prisma from "../../../infrastructure/database/prismaClient.ts";
import { publicUserSelect } from "../../serializers/user.select.ts";

export const getFeedStories = async (userId: number) => {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  return prisma.story.findMany({
    where: {
      userId: { in: followingIds },
      expiresAt: { gt: new Date() },
    },
    include: {
      user: { select: publicUserSelect },
      views: true,
    },
    orderBy: { createdAt: "desc" },
  });
};