import { Errors } from "../../../infrastructure/errors/ApiError.ts";
import { UserSanctionType } from "@prisma/client";
import { getActiveUserSanction, isBannedSanction } from "./getActiveUserSanction.ts";

function toIso(d?: Date | null): string | null {
  return d ? d.toISOString() : null;
}

type Input = {
  userId: number;
  // restricted нельзя писать/реактить/постить и т.п.
  forbidRestricted?: boolean;
};

export async function assertUserActionAllowed({ userId, forbidRestricted = false }: Input) {
  const active = await getActiveUserSanction(userId);
  if (!active) return;

  const payload = {
    sanctionId: active.id,
    type: active.type,
    endsAt: toIso(active.endsAt),
    reason: active.reason ?? null,
  };

  if (isBannedSanction(active.type)) {
    throw Errors.forbidden("Account is banned", payload);
  }

  if (forbidRestricted && active.type === UserSanctionType.RESTRICT) {
    throw Errors.forbidden("Account is restricted", payload);
  }
}