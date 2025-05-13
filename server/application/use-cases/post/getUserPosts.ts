import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getUserPosts = async (userId: number) => {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      comments: true,
      likes: true,
      savedBy: true,
    },
  });
};
