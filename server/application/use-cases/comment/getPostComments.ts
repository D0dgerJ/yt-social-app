import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getPostComments = async (postId: number) => {
  if (!postId || postId <= 0) {
    throw new Error('Invalid post ID');
  }

  return prisma.comment.findMany({
  where: { postId },
  include: {
    user: true,
    replies: {
      include: {
        user: true,
      },
      orderBy: { createdAt: 'asc' },
    },
    _count: {
      select: { likes: true },
    },
    likes: true,
  },
  orderBy: { createdAt: 'desc' },
});

};
