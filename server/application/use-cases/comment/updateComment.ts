import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

interface UpdateCommentInput {
  commentId: number;
  content?: string;
  files?: string[];
  images?: string[];
  videos?: string[];
}

export const updateComment = async ({
  commentId,
  content,
  files,
  images,
  videos,
}: UpdateCommentInput) => {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,
      post: { status: ContentStatus.ACTIVE },
    },
    select: { id: true },
  });

  if (!comment) {
    throw new Error("Comment does not exist.");
  }

  return prisma.comment.update({
    where: { id: commentId },
    data: {
      ...(content !== undefined && { content }),
      ...(files !== undefined && { files }),
      ...(images !== undefined && { images }),
      ...(videos !== undefined && { videos }),
    },
  });
};