import prisma from "../../../infrastructure/database/prismaClient.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts"

interface SavePostInput {
  userId: number;
  postId: number;
}

export const savePost = async ({ userId, postId }: SavePostInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

  await assertUserActionAllowed({ userId, forbidRestricted: true });
  await assertPostActionAllowed(postId);

  try {
    return await prisma.savedPost.create({
      data: { userId, postId },
    });
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };

    if (err.code === "P2002" && err.meta?.target?.includes("userId_postId")) {
      return { alreadySaved: true };
    }

    throw error;
  }
};