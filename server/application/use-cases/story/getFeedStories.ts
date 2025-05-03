import prisma from "../../../infrastructure/database/prismaClient";

export const getFeedStories = async (userId: number) => {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map(f => f.followingId);

  return prisma.story.findMany({
    where: {
      userId: { in: followingIds },
      expiresAt: { gt: new Date() },
    },
    include: {
      user: true,
      views: true,
    },
    orderBy: { createdAt: "desc" },
  });
};
