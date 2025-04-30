import prisma from "../../../infrastructure/database/prismaClient.js";

export const updateProfilePicture = async (userId, imageUrl) => {
  return await prisma.user.update({
    where: { id: Number(userId) },
    data: { profilePicture: imageUrl },
  });
};