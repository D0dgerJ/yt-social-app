import prisma from "../../../infrastructure/database/prismaClient";

export const getUserProfile = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};
