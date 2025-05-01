import prisma from "../../../infrastructure/database/prismaClient.js";

export const updateComment = async ({ commentId, userId, content }) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== userId) throw new Error("You can only update your own comments");

  const updated = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });

  return updated;
};