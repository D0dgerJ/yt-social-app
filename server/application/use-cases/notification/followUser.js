import prisma from "../../../infrastructure/database/prismaClient.js";
import { createNotification } from "./createNotification.js";

export const followUser = async ({ userId, targetUserId }) => {
  if (userId === targetUserId) {
    throw new Error("You cannot follow yourself");
  }

  // Проверяем, не существует ли уже такая подписка
  const alreadyFollowing = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  if (alreadyFollowing) {
    throw new Error("You are already following this user");
  }

  await prisma.follow.create({
    data: {
      followerId: userId,
      followingId: targetUserId,
    },
  });

  // Создаем уведомление
  await createNotification({
    type: "follow",
    content: `User ${userId} followed you`,
    fromUserId: userId,
    toUserId: targetUserId,
  });

  return { message: "User followed" };
};
