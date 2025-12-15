import prisma from "../../../infrastructure/database/prismaClient.ts";

interface GetEventsInput {
  userId: number;
  from: string;
  to: string;
}

export const getEvents = async ({ userId, from, to }: GetEventsInput) => {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  return prisma.event.findMany({
    where: {
      userId,
      OR: [
        {
          startAt: {
            gte: fromDate,
            lt: toDate,
          },
        },
        {
          AND: [
            { startAt: { lt: toDate } },
            { endAt: { gte: fromDate } },
          ],
        },
      ],
    },
    orderBy: {
      startAt: "asc",
    },
  });
};
