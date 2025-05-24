import prisma from "../../../infrastructure/database/prismaClient";

export const getCommentById = async (commentId: number) => {
  return await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
      _count: { select: { likes: true } },
      likes: { select: { userId: true } },
    },
  });
};
