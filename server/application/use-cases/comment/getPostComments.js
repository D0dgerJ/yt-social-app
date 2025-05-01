import prisma from "../../../infrastructure/database/prismaClient.js";

export const getPostComments = async (postId) => {
  const comments = await prisma.comment.findMany({
    where: { postId: Number(postId) },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return comments;
};
