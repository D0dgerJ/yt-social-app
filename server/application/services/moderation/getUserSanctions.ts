import { UserSanctionStatus } from "@prisma/client";
import prisma from "../../../infrastructure/database/prismaClient.ts";

export async function getUserSanctions(userId: number) {
  const now = new Date();

  // Единая экспирация (как в enforceSanctions):
  // ACTIVE && endsAt <= now -> EXPIRED
  await prisma.userSanction.updateMany({
    where: {
      userId,
      status: UserSanctionStatus.ACTIVE,
      endsAt: { lte: now },
    },
    data: { status: UserSanctionStatus.EXPIRED },
  });

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