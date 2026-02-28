import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";

interface UnfollowUserInput {
  followerId: number;
  followingId: number;
}

export const unfollowUser = async ({ followerId, followingId }: UnfollowUserInput) => {
  if (!Number.isFinite(followerId) || followerId <= 0) throw Errors.validation("Invalid followerId");
  if (!Number.isFinite(followingId) || followingId <= 0) throw Errors.validation("Invalid followingId");
  if (followerId === followingId) throw Errors.validation("You cannot unfollow yourself");

  await assertUserActionAllowed({ userId: followerId, forbidRestricted: true });

  return prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
};