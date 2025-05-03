import prisma from '../../../infrastructure/database/prismaClient';

interface CreateCommentInput {
  userId: number;
  postId: number;
  content: string;
}

export const createComment = async ({ userId, postId, content }: CreateCommentInput) => {
  return prisma.comment.create({
    data: {
      userId,
      postId,
      content,
    },
  });
};
