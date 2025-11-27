import prisma from "../../../infrastructure/database/prismaClient.ts";
import { createNotification } from "./createNotification.ts";

interface FollowUserInput {
  followerId: number;
  followingId: number;
}

export const followUser = async ({
  followerId,
  followingId,
}: FollowUserInput) => {
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
