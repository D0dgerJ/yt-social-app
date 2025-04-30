import prisma from "../../../infrastructure/database/prismaClient.js";

export const unsavePost = async ({ postId, userId }) => {
  return await prisma.savedPost.deleteMany({
    where: {
      postId: Number(postId),
      userId: Number(userId),
    },
  });
};
