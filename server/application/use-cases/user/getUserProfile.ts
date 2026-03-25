import prisma from "../../../infrastructure/database/prismaClient.ts";
import { privateUserSelect } from "../../serializers/user.select.ts";

export const getUserProfile = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    select: privateUserSelect,
  });
};