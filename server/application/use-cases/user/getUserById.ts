import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getUserById = async (userId: number) => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};
