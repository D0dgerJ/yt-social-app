import prisma from "../../../infrastructure/database/prismaClient.js";

export const getFriendStories = async (userId) => {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const ids = following.map(f => f.followingId);

  const stories = await prisma.story.findMany({
    where: {
      userId: { in: ids },
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: { id: true, username: true, profilePicture: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return stories;
};
