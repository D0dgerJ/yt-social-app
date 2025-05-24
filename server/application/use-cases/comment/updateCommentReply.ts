import prisma from "../../../infrastructure/database/prismaClient";

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
  images = [],
  videos = [],
  files = [],
}: UpdateReplyInput) => {
  return await prisma.comment.update({
    where: { id: commentId },
    data: { content, images, videos, files },
  });
};
