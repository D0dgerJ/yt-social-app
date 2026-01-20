import prisma from '../../../infrastructure/database/prismaClient.ts';
import { ContentStatus } from '@prisma/client';

export const getAllPosts = async () => {
  return prisma.post.findMany({
    where: { status: ContentStatus.ACTIVE },
    orderBy: { createdAt: 'desc' },
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
        select: { likes: true, comments: true },
      },
    },
  });
};