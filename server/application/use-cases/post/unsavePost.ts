import prisma from "../../../infrastructure/database/prismaClient.ts";

interface UnsavePostInput {
  userId: number;
  postId: number;
}

export const unsavePost = async ({ userId, postId }: UnsavePostInput) => {
  try {
    const deleted = await prisma.savedPost.delete({
      where: {
        userId_postId: { userId, postId },
      },
    });

    return { unsaved: true, deleted };
  } catch (error: unknown) {
    const err = error as { code?: string };

    if (err.code === "P2025") {
      return { unsaved: false };
    }

    throw error;
  }
};
