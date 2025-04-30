import prisma from "../../../infrastructure/database/prismaClient.js";

export const unfollowUser = async (followerId, followingId) => {
  if (Number(followerId) === Number(followingId)) {
    throw new Error("You cannot unfollow yourself");
  }

  return await prisma.follow.deleteMany({
    where: {
      followerId: Number(followerId),
      followingId: Number(followingId),
    },
  });
};