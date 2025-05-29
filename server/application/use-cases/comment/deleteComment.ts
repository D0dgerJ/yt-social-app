import prisma from '../../../infrastructure/database/prismaClient.ts';

export const deleteComment = async (commentId: number) => {
  await prisma.comment.deleteMany({
    where: { parentId: commentId },
  });

  await prisma.comment.delete({
    where: { id: commentId },
  });
};