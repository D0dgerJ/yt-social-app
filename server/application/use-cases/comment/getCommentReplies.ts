import prisma from '../../../infrastructure/database/prismaClient.ts';

export const getCommentReplies = async (commentId: number) => {
  const replies = await prisma.comment.findMany({
    where: { parentId: commentId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      _count: {
        select: { likes: true },
      },
      likes: {
        select: { userId: true },
      },
    },
  });

  return replies;
};