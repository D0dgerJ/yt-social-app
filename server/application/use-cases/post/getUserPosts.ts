import prisma from '../../../infrastructure/database/prismaClient.ts';
import { ContentStatus } from '@prisma/client';

export const getUserPosts = async (userId: number) => {
  return prisma.post.findMany({
    where: { userId, status: ContentStatus.ACTIVE },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      comments: true,
      likes: true,
      savedBy: true,
    },
  });
};