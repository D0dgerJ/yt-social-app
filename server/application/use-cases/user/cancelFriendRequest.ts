import prisma from "../../../infrastructure/database/prismaClient.ts";

interface CancelFriendRequestParams {
  senderId: number;
  receiverId: number;
}

export const cancelFriendRequest = async ({ senderId, receiverId }: CancelFriendRequestParams) => {
  const existing = await prisma.friendRequest.findUnique({
    where: {
      senderId_receiverId: { senderId, receiverId }
    },
  });

  if (!existing) {
    throw new Error("Friend request not found");
  }

  if (existing.status !== "pending") {
    throw new Error("Only pending requests can be cancelled");
  }

  await prisma.friendRequest.delete({
    where: { senderId_receiverId: { senderId, receiverId } },
  });

  return { success: true };
};
