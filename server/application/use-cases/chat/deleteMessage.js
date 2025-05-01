import prisma from "../../../infrastructure/database/prismaClient.js";

export const deleteMessage = async ({ userId, messageId }) => {
  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message || message.senderId !== userId) {
    throw new Error("You can only delete your own messages");
  }

  await prisma.message.delete({ where: { id: messageId } });

  return { message: "Message deleted" };
};
