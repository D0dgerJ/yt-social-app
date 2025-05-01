import prisma from "../../../infrastructure/database/prismaClient.js";

export const updateMessage = async ({ userId, messageId, newContent }) => {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message || message.senderId !== userId) {
    throw new Error("You can only edit your own messages");
  }

  return prisma.message.update({
    where: { id: messageId },
    data: { content: newContent },
  });
};
