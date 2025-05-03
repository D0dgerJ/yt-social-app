import prisma from '../../../infrastructure/database/prismaClient';

export const deletePost = async (postId: number) => {
  return prisma.post.delete({
    where: { id: postId },
  });
};
