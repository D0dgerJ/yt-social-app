import prisma from "../../../infrastructure/database/prismaClient.js";
import { publicUserSelect } from "../../serializers/user.select.js";

export const getUserById = async (userId: number) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
};