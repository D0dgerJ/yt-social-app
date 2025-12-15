import prisma from "../../../infrastructure/database/prismaClient.ts";

export const deleteEvent = async (userId: number, eventId: number) => {
  return prisma.event.deleteMany({
    where: {
      id: eventId,
      userId,
    },
  });
};
