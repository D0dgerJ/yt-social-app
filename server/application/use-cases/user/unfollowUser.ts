import prisma from "../../../infrastructure/database/prismaClient.ts";

interface UnfollowUserInput {
  followerId: number;
  followingId: number;
}

export const unfollowUser = async ({
  followerId,
  followingId,
}: UnfollowUserInput) => {
  return await prisma.follow.deleteMany({
    where: {
      followerId,
      followingId,
    },
  });
};
