import prisma from "../../../infrastructure/database/prismaClient.js";

export const createChat = async ({ userIds, name }) => {
  if (!userIds || userIds.length < 2) {
    throw new Error("At least two users are required to start a chat");
  }

  const isGroup = userIds.length > 2 || name;

  const conversation = await prisma.conversation.create({
    data: {
      name: isGroup ? name : null,
      isGroup: isGroup,
      participants: {
        create: userIds.map((userId) => ({ userId })),
      },
    },
    include: {
      participants: true,
    },
  });

  return conversation;
};
