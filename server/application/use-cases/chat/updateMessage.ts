import prisma from "../../../infrastructure/database/prismaClient";

interface UpdateMessageInput {
  messageId: number;
  content: string;
  userId: number;
}

export const updateMessage = async ({ messageId, content, userId }: UpdateMessageInput) => {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) throw new Error("Сообщение не найдено");
  if (message.senderId !== userId) throw new Error("Вы не можете редактировать это сообщение");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content },
  });

  return updated;
};
