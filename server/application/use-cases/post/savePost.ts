import prisma from '../../../infrastructure/database/prismaClient.ts';

interface SavePostInput {
  userId: number;
  postId: number;
}

export const savePost = async ({ userId, postId }: SavePostInput) => {
  return prisma.savedPost.create({
    data: {
      userId,
      postId,
    },
  });
};
