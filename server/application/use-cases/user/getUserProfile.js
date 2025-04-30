import prisma from "../../../infrastructure/database/prismaClient.js";

export const getUserProfile = async (username) => {
  return await prisma.user.findUnique({
    where: { username },
  });
};