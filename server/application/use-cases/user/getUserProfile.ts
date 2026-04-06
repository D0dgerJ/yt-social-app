import prisma from "../../../infrastructure/database/prismaClient.js";
import { privateUserSelect } from "../../serializers/user.select.js";

export const getUserProfile = async (id: number) => {
  return prisma.user.findUnique({
    where: { id },
    select: privateUserSelect,
  });
};