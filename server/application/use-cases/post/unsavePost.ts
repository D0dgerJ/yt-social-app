import prisma from "../../../infrastructure/database/prismaClient";

interface UnsavedPostInput {
  userId: number;
  postId: number;
}

export const unsavePost = async ({ userId, postId }: UnsavedPostInput) => {
  return prisma.savedPost.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    }
  });
};
