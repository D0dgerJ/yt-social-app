import prisma from "../../../infrastructure/database/prismaClient.js";
import { createNotification } from "./createNotification.js";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";

interface FollowUserInput {
  followerId: number;
  followingId: number;
}

export const followUser = async ({
  followerId,
  followingId,
}: FollowUserInput) => {
  if (!Number.isFinite(followerId) || followerId <= 0) throw Errors.validation("Invalid followerId");
  if (!Number.isFinite(followingId) || followingId <= 0) throw Errors.validation("Invalid followingId");
  if (followerId === followingId) throw Errors.validation("You cannot follow yourself");

  // если решаем запрещать restricted:
  await assertUserActionAllowed({ userId: followerId, forbidRestricted: true });
  // если решишь разрешить restricted — поменяешь на false
  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });

  if (existingFollow) {
    throw new Error("You already follow this user");
  }

  const follow = await prisma.follow.create({
    data: {
      followerId,
      followingId,
    },
  });

  await createNotification({
    fromUserId: followerId,
    toUserId: followingId,
    type: "follow",
    payload: { followerId, followingId },
  });

  return follow;
};
