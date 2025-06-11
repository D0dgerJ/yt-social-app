import prisma from "../../../infrastructure/database/prismaClient";

export const getConversationMessages = async (conversationId: number) => {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });
};
