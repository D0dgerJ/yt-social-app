import prisma from "../../../infrastructure/database/prismaClient.js";

export const deleteConversationIfEmpty = async (conversationId) => {
  const remaining = await prisma.participant.count({
    where: { conversationId },
  });

  if (remaining === 0) {
    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId } });

    return { message: "Conversation deleted because it's empty" };
  }

  return { message: "Conversation still has participants" };
};
