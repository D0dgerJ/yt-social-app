import prisma from "../../../infrastructure/database/prismaClient.js";

export const getUserFriends = async (userId) => {
  const followings = await prisma.follow.findMany({
    where: { followerId: Number(userId) },
    include: {
      following: true,
    },
  });

  return followings.map((f) => ({
    id: f.following.id,
    username: f.following.username,
    profilePicture: f.following.profilePicture,
  }));
};