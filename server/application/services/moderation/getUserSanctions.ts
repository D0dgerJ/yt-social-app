import prisma from "../../../infrastructure/database/prismaClient.ts";

export async function getUserSanctions(userId: number) {
  return prisma.userSanction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      userId: true,
      type: true,
      status: true,
      reason: true,
      message: true,
      evidence: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
      createdBy: { select: { id: true, username: true } },
      liftedAt: true,
      liftReason: true,
      liftedBy: { select: { id: true, username: true } },
    },
  });
}
