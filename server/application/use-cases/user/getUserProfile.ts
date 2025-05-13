import prisma from "../../../infrastructure/database/prismaClient.ts";

export const getUserProfile = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};
