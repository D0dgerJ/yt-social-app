import prisma from "../../../infrastructure/database/prismaClient.js";

export const deleteEvent = async (userId: number, eventId: number) => {
  return prisma.event.deleteMany({
    where: {
      id: eventId,
      userId,
    },
  });
};
