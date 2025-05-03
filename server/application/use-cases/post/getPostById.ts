import prisma from "../../../infrastructure/database/prismaClient";

export const getPostById = async (postId: number) => {
  return prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });
};
