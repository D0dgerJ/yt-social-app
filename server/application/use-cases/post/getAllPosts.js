import prisma from "../../../infrastructure/database/prismaClient.js";

export const getAllPosts = async () => {
  return await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      likes: true,
      comments: true,
    },
  });
};
