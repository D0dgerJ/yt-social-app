import prisma from "../../../infrastructure/database/prismaClient";

export const getMessageReactions = async (messageId: number) => {
  return prisma.reaction.findMany({
    where: { messageId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          profilePicture: true,
        },
      },
    },
  });
};