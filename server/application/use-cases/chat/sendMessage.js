import prisma from "../../../infrastructure/database/prismaClient.js";

export const sendMessage = async ({ conversationId, senderId, content, mediaUrl }) => {
  return await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content,
      mediaUrl,
    },
  });
};
