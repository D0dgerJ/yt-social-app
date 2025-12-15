import prisma from "../../../infrastructure/database/prismaClient.ts";

interface UpdateEventInput {
  userId: number;
  eventId: number;
  data: Record<string, any>;
}

export const updateEvent = async ({
  userId,
  eventId,
  data,
}: UpdateEventInput) => {
  return prisma.event.updateMany({
    where: {
      id: eventId,
      userId,
    },
    data: {
      ...data,
      startAt: data.startAt ? new Date(data.startAt) : undefined,
      endAt: data.endAt ? new Date(data.endAt) : undefined,
    },
  });
};
