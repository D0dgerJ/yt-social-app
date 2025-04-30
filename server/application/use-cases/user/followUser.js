import prisma from "../../../infrastructure/database/prismaClient.js";

export const followUser = async (followerId, followingId) => {
  if (Number(followerId) === Number(followingId)) {
    throw new Error("You cannot follow yourself");
  }

  return await prisma.follow.create({
    data: {
      followerId: Number(followerId),
      followingId: Number(followingId),
    },
  });
};