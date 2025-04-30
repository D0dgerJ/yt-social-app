import prisma from "../../../infrastructure/database/prismaClient.js";

export const getUserPosts = async (userId) => {
  return await prisma.post.findMany({
    where: { userId: Number(userId) },
    orderBy: { createdAt: "desc" },
    include: {
      likes: true,
      comments: true,
    },
  });
};
