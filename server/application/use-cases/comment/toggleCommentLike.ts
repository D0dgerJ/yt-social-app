import prisma from '../../../infrastructure/database/prismaClient.ts';

interface ToggleLikeParams {
  commentId: number;
  userId: number;
}

export const toggleCommentLike = async ({ commentId, userId }: ToggleLikeParams) => {
  const existingLike = await prisma.commentLike.findUnique({
    where: {
      userId_commentId: {
        userId,
        commentId,
      },
    },
  });

  if (existingLike) {
    await prisma.commentLike.delete({
      where: { id: existingLike.id },
    });
    return { liked: false };
  }

  await prisma.commentLike.create({
    data: {
      userId,
      commentId,
    },
  });

  return { liked: true };
};
