import prisma from '../../../infrastructure/database/prismaClient';

export const deleteComment = async (commentId: number) => {
  return prisma.comment.delete({
    where: { id: commentId },
  });
};
