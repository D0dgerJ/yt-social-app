import prisma from "../../../infrastructure/database/prismaClient";

export const deleteUser = async (userId: number) => {
  return await prisma.user.delete({
    where: { id: userId },
  });
};
