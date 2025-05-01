import prisma from "../../../infrastructure/database/prismaClient.js";

export const deleteComment = async ({ commentId, userId, isAdmin }) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");

  if (comment.userId !== userId && !isAdmin) {
    throw new Error("You do not have permission to delete this comment");
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return { message: "Comment deleted successfully" };
};