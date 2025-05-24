import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getAllPosts = async () => {
  return prisma.post.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      likes: true,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  });
};