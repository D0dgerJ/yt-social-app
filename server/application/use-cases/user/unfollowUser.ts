import prisma from "../../../infrastructure/database/prismaClient";

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
