import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

export const deleteCommentReply = async (commentId: number) => {
  const reply = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: { not: null }, 
      post: { status: ContentStatus.ACTIVE },
    },
    select: { id: true },
  });

  if (!reply) {
    throw new Error("Comment does not exist.");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { ok: true };
};
