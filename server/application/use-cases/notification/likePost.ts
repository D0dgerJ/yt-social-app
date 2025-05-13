import prisma from '../../../infrastructure/database/prismaClient.ts';

interface LikePostInput {
  userId: number;
  postId: number;
}

export const likePost = async ({ userId, postId }: LikePostInput) => {
  try {
    return await prisma.like.create({
      data: {
        userId,
        postId,
      },
    });
  } catch (error: any) {
    if (
      error.code === 'P2002' &&
      error.meta?.target?.includes('userId_postId')
    ) {
      throw new Error('User already liked this post');
    }

    throw error;
  }
};
