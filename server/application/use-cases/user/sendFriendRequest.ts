import prisma from "../../../infrastructure/database/prismaClient.ts";

interface SendFriendRequestInput {
  senderId: number;
  receiverId: number;
}

export const sendFriendRequest = async ({ senderId, receiverId }: SendFriendRequestInput) => {
  if (senderId === receiverId) {
    throw new Error("Нельзя отправить запрос самому себе.");
  }

  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ],
    },
  });

  if (existing) {
    throw new Error("Запрос в друзья уже существует.");
  }

  return await prisma.friendRequest.create({
    data: {
      senderId,
      receiverId,
      status: "pending",
    },
  });
};
