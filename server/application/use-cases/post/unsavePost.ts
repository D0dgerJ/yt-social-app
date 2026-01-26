import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";

interface UnsavePostInput {
  userId: number;
  postId: number;
}

export const unsavePost = async ({ userId, postId }: UnsavePostInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

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
      return { unsaved: true, alreadyUnsaved: true };
    }

    throw error;
  }
};
