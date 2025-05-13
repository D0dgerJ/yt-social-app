import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getFriendStories = async (userId: number) => {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const friendIds = following.map((f) => f.followingId);

  return prisma.story.findMany({
    where: {
      userId: { in: friendIds },
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
};
