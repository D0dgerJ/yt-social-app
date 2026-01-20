import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";

interface UpdateReplyInput {
  commentId: number;
  content?: string;
  images?: string[];
  videos?: string[];
  files?: string[];
}

export const updateCommentReply = async ({
  commentId,
  content,
  images,
  videos,
  files,
}: UpdateReplyInput) => {
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

  return prisma.comment.update({
    where: { id: commentId },
    data: {
      ...(content !== undefined && { content }),
      ...(images !== undefined && { images }),
      ...(videos !== undefined && { videos }),
      ...(files !== undefined && { files }),
    },
  });
};
