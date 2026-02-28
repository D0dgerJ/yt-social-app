import prisma from "../../../infrastructure/database/prismaClient.ts";
import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.ts";

interface AcceptFriendRequestInput {
  requestId: number;
  currentUserId: number;
}

export const acceptFriendRequest = async ({
  requestId,
  currentUserId,
}: AcceptFriendRequestInput) => {
  if (!Number.isFinite(requestId) || requestId <= 0) throw Errors.validation("Invalid requestId");
  if (!Number.isFinite(currentUserId) || currentUserId <= 0) throw Errors.validation("Invalid currentUserId");

  await assertUserActionAllowed({ userId: currentUserId, forbidRestricted: true });

  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    select: { id: true, receiverId: true, status: true },
  });

  if (!request) throw Errors.notFound("Friend request not found");
  if (request.receiverId !== currentUserId) throw Errors.forbidden("You cannot accept this request");
  if (request.status !== "pending") throw Errors.conflict("Only pending requests can be accepted");

  return prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "accepted" },
  });
};