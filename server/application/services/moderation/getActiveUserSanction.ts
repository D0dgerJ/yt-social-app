import prisma from "../../../infrastructure/database/prismaClient.ts";
import { UserSanctionStatus, UserSanctionType } from "@prisma/client";

export async function getActiveUserSanction(userId: number) {
  const now = new Date();

  // Протухаем любую активную санкцию, у которой endsAt <= now
  await prisma.userSanction.updateMany({
    where: { userId, status: UserSanctionStatus.ACTIVE, endsAt: { lte: now } },
    data: { status: UserSanctionStatus.EXPIRED },
  });

  // ACTIVE && (endsAt == null || endsAt > now)
  return prisma.userSanction.findFirst({
    where: {
      userId,
      status: UserSanctionStatus.ACTIVE,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, endsAt: true, reason: true },
  });
}

export function isBannedSanction(type: UserSanctionType) {
  return type === UserSanctionType.PERM_BAN || type === UserSanctionType.TEMP_BAN;
}