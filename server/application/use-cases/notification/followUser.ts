import prisma from '../../../infrastructure/database/prismaClient';

interface FollowUserInput {
  followerId: number;
  followingId: number;
}

export const followUser = async ({ followerId, followingId }: FollowUserInput) => {
  return prisma.follow.create({
    data: {
      followerId,
      followingId,
    },
  });
};
