import prisma from "../../../infrastructure/database/prismaClient.ts";

interface AcceptFriendRequestInput {
  requestId: number;
  currentUserId: number;
}

export const acceptFriendRequest = async ({ requestId, currentUserId }: AcceptFriendRequestInput) => {
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new Error("Запрос не найден.");
  }

  if (request.receiverId !== currentUserId) {
    throw new Error("У вас нет прав на принятие этого запроса.");
  }

  const updated = await prisma.friendRequest.update({
    where: { id: requestId },
    data: { status: "accepted" },
  });

  return updated;
};
