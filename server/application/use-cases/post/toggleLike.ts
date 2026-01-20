import prisma from "../../../infrastructure/database/prismaClient.ts";
import { ContentStatus } from "@prisma/client";
import { likePost } from "./likePost.ts";

interface ToggleLikeInput {
  userId: number;
  postId: number;
}

export const toggleLike = async ({ userId, postId }: ToggleLikeInput) => {
  const activePost = await prisma.post.findFirst({
    where: { id: postId, status: ContentStatus.ACTIVE },
    select: { id: true },
  });

  if (!activePost) {
    throw new Error("Post not found");
  }

  const existing = await prisma.like.findFirst({
    where: { userId, postId },
    select: { id: true },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  try {
    const like = await likePost({ userId, postId });
    return { liked: true, like };
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] } };

    if (err.code === "P2002" && err.meta?.target?.includes("userId_postId")) {
      return { liked: true };
    }

    throw error;
  }
};
