import prisma from "../../../infrastructure/database/prismaClient.js";
import { Errors } from "../../../infrastructure/errors/ApiError.js";
import { assertUserActionAllowed } from "../../services/moderation/assertUserActionAllowed.js";
import { privateUserSelect } from "../../serializers/user.select.js";

interface UpdateUserInput {
  userId: number;
  data: {
    email?: string;
    username?: string;
    from?: string;
    city?: string;
    relationship?: number;
    coverPicture?: string;
    desc?: string;
  };
}

export const updateUser = async ({ userId, data }: UpdateUserInput) => {
  if (!Number.isFinite(userId) || userId <= 0) throw Errors.validation("Invalid userId");

  await assertUserActionAllowed({ userId, forbidRestricted: true });

  return prisma.user.update({
    where: { id: userId },
    data,
    select: privateUserSelect,
  });
};