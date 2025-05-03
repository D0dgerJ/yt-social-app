import prisma from '../../../infrastructure/database/prismaClient';

interface UpdateCommentInput {
  commentId: number;
  content: string;
}

export const updateComment = async ({ commentId, content }: UpdateCommentInput) => {
  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
  });
};
