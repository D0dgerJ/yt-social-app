import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";

interface CancelFriendRequestParams {
  senderId: number;
  receiverId: number;
}

export const cancelFriendRequest = async ({ senderId, receiverId }: CancelFriendRequestParams) => {
  if (!Number.isFinite(senderId) || senderId <= 0) throw Errors.validation("Invalid senderId");
  if (!Number.isFinite(receiverId) || receiverId <= 0) throw Errors.validation("Invalid receiverId");
  if (senderId === receiverId) throw Errors.validation("Invalid senderId/receiverId");

  await assertUserActionAllowed({ userId: senderId, forbidRestricted: true });

  const existing = await prisma.friendRequest.findUnique({
    where: { senderId_receiverId: { senderId, receiverId } },
    select: { id: true, status: true },
  });

  if (!existing) throw Errors.notFound("Friend request not found");
  if (existing.status !== "pending") throw Errors.conflict("Only pending requests can be cancelled");

  await prisma.friendRequest.delete({
    where: { senderId_receiverId: { senderId, receiverId } },
  });

  return { success: true };
};