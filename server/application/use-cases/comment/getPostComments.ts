import prisma from '../../../infrastructure/database/prismaClient';

export const getPostComments = async (postId: number) => {
  return prisma.comment.findMany({
    where: { postId },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};
