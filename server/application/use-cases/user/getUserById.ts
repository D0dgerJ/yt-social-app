import prisma from "../../../infrastructure/database/prismaClient.ts";
import { publicUserSelect } from "../../serializers/user.select.ts";

export const getUserById = async (userId: number) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
};