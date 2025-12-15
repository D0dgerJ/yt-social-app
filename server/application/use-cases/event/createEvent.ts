import prisma from "../../../infrastructure/database/prismaClient.ts";

interface CreateEventInput {
  userId: number;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  allDay?: boolean;
  color?: string;
}

export const createEvent = async ({
  userId,
  title,
  description,
  startAt,
  endAt,
  allDay = true,
  color,
}: CreateEventInput) => {
  return prisma.event.create({
    data: {
      userId,
      title,
      description,
      startAt: new Date(startAt),
      endAt: endAt ? new Date(endAt) : null,
      allDay,
      color,
    },
  });
};
