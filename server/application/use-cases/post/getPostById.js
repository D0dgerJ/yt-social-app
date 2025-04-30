import prisma from "../../../infrastructure/database/prismaClient.js";

export const getPostById = async (postId) => {
  return await prisma.post.findUnique({
    where: { id: Number(postId) },
    include: {
      user: true,
      likes: true,
      comments: true,
    },
  });
};
