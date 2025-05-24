import prisma from '../../../infrastructure/database/prismaClient.ts';

export const deleteCommentReply = async (commentId: number) => {
  return await prisma.comment.delete({ where: { id: commentId } });
};
