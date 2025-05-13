import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getAllPosts = async () => {
  return prisma.post.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: true,
      comments: true,
      likes: true,
      savedBy: true,
    },
  });
};
