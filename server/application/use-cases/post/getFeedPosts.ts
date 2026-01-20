import prisma from '../../../infrastructure/database/prismaClient.ts';
import { ContentStatus } from '@prisma/client';

export const getFeedPosts = async (userId: number) => {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const followingIds = following.map(f => f.followingId);

  return prisma.post.findMany({
    where: {
      status: ContentStatus.ACTIVE,
      OR: [{ userId }, { userId: { in: followingIds } }],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      comments: true,
      likes: true,
      savedBy: true,
    },
  });
};
