import prisma from '../../../infrastructure/database/prismaClient';

interface LikePostInput {
  userId: number;
  postId: number;
}

export const likePost = async ({ userId, postId }: LikePostInput) => {
  return prisma.like.create({
    data: {
      userId,
      postId,
    },
  });
};
