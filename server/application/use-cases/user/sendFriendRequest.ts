import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.js";

interface SendFriendRequestInput {
  senderId: number;
  receiverId: number;
}

export const sendFriendRequest = async ({ senderId, receiverId }: SendFriendRequestInput) => {
  if (!Number.isFinite(senderId) || senderId <= 0) throw Errors.validation("Invalid senderId");
  if (!Number.isFinite(receiverId) || receiverId <= 0) throw Errors.validation("Invalid receiverId");
  if (senderId === receiverId) throw Errors.validation("You cannot send a friend request to yourself");

  await assertUserActionAllowed({ userId: senderId, forbidRestricted: true });

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    throw Errors.conflict("Friend request already exists");
  }

  return prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
      status: "pending",
    },
  });
};