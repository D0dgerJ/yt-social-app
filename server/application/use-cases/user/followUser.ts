import prisma from "../../../infrastructure/database/prismaClient.js";
import { createNotification } from "../notification/createNotification.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.js";

interface FollowUserInput {
  followerId: number;
  followingId: number;
}

export const followUser = async ({ followerId, followingId }: FollowUserInput) => {
  if (!Number.isFinite(followerId) || followerId <= 0) throw Errors.validation("Invalid followerId");
  if (!Number.isFinite(followingId) || followingId <= 0) throw Errors.validation("Invalid followingId");
  if (followerId === followingId) throw Errors.validation("You cannot follow yourself");

  await assertUserActionAllowed({ userId: followerId, forbidRestricted: true });

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
    select: { followerId: true },
  });

  if (existingFollow) {
    throw Errors.conflict("You already follow this user");
  }

  const follow = await prisma.follow.create({
    data: { followerId, followingId },
  });

  try {
    await createNotification({
      fromUserId: followerId,
      toUserId: followingId,
      type: "follow",
      payload: {},
    });
  } catch (err) {
    console.error("[followUser] failed to create follow notification:", err);
  }

  return follow;
};