import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertPostActionAllowed } from "../../services/post/assertPostActionAllowed.ts";
import { likePost } from "./likePost.ts";
import { assertActionAllowed } from "../../services/abuse/antiAbuse.ts";

interface ToggleLikeInput {
  userId: number;
  postId: number;
}

export const toggleLike = async ({ userId, postId }: ToggleLikeInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");
  if (!Number.isFinite(postId) || postId <= 0) throw Errors.validation("Invalid postId");

  // Anti-abuse: санкции + rate limit (реакции/лайки)
  await assertActionAllowed({ actorId: userId, action: "REACTION_ADD" });

  await assertPostActionAllowed(postId);

  const existing = await prisma.like.findFirst({
    where: { userId, postId },
    select: { id: true },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    return { liked: false };
  }

  // likePost НЕ должен делать повторные анти-абьюз проверки
  const like = await likePost({ userId, postId });
  return { liked: true, like };
};