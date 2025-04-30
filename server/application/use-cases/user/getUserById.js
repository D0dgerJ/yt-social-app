import prisma from "../../../infrastructure/database/prismaClient.js";

export const getUserById = async (userId) => {
  return await prisma.user.findUnique({
    where: { id: Number(userId) },
  });
};