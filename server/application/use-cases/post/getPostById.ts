import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getPostById = async (postId: number) => {
  if (!postId || isNaN(postId)) {
    throw new Error("Invalid or missing postId");
  }

  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
};
