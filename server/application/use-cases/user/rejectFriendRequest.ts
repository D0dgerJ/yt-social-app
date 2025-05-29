import prisma from "../../../infrastructure/database/prismaClient.ts";

interface RejectFriendRequestInput {
  requestId: number;
  currentUserId: number;
}

export const rejectFriendRequest = async ({ requestId, currentUserId }: RejectFriendRequestInput) => {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Запрос не найден.");
  }

  if (request.receiverId !== currentUserId) {
    throw new Error("У вас нет прав на отклонение этого запроса.");
  }

  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "rejected" },
  });

  return updated;
};
