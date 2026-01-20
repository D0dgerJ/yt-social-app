import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

export const deleteComment = async (commentId: number) => {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      parentId: null,
      post: { status: ContentStatus.ACTIVE },
    },
    select: { id: true },
  });

  if (!comment) {
    throw new Error("Comment does not exist.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.comment.deleteMany({
      where: { parentId: commentId },
    });

    await tx.comment.delete({
      where: { id: commentId },
    });
  });

  return { ok: true };
};
