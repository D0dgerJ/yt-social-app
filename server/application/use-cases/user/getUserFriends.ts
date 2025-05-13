import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getUserFriends = async (userId: number) => {
  return await prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: true },
  });
};
