import prisma from "../../../infrastructure/database/prismaClient.ts";
import { likePost } from "./likePost.ts";

interface ToggleLikeInput {
  userId: number;
  postId: number;
}

export const toggleLike = async ({ userId, postId }: ToggleLikeInput) => {
  const existing = await prisma.like.findFirst({
    where: { userId, postId },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  const like = await likePost({ userId, postId });
  return { liked: true, like };
};