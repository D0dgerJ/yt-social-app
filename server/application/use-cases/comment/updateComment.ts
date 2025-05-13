import prisma from '../../../infrastructure/database/prismaClient.ts';

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
