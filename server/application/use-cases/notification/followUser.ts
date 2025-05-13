import prisma from '../../../infrastructure/database/prismaClient.ts';

interface FollowUserInput {
  followerId: number;
  followingId: number;
}

export const followUser = async ({ followerId, followingId }: FollowUserInput) => {
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existingFollow) {
    throw new Error('You already follow this user');
  }

  return prisma.follow.create({
    data: {
      followerId,
      followingId,
    },
  });
};