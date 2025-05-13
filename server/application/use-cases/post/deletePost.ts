import prisma from '../../../infrastructure/database/prismaClient.ts';

export const deletePost = async (postId: number) => {
  return prisma.post.delete({
    where: { id: postId },
  });
};
