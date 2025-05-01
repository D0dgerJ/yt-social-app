import prisma from "../../../infrastructure/database/prismaClient.js";

export const addParticipant = async ({ conversationId, userId }) => {
  const existing = await prisma.participant.findFirst({
    where: {
      conversationId,
      userId,
    },
  });

  if (existing) {
    throw new Error("User already in the conversation");
  }

  return await prisma.participant.create({
    data: {
      conversationId,
      userId,
    },
  });
};