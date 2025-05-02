import prisma from "../../../infrastructure/database/prismaClient.js";

export const followUser = async ({ userId, targetUserId }) => {
  if (userId === targetUserId) {
    throw new Error("You cannot follow yourself");
  }

  const alreadyFollowing = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  if (alreadyFollowing) {
    throw new Error("You are already following this user");
  }

  await prisma.follow.create({
    data: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  return { targetUserId };
};
