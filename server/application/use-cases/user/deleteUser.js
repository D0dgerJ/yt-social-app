import prisma from "../../../infrastructure/database/prismaClient.js";

export const deleteUser = async (userId) => {
  return await prisma.user.delete({
    where: { id: Number(userId) },
  });
};