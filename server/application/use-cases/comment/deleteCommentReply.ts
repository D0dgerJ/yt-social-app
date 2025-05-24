import prisma from "../../../infrastructure/database/prismaClient";

export const deleteCommentReply = async (commentId: number) => {
  return await prisma.comment.delete({ where: { id: commentId } });
};
