import prisma from "../../../infrastructure/database/prismaClient.js";
import bcrypt from "bcrypt";

export const updateUser = async (userId, updateData) => {
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  return await prisma.user.update({
    where: { id: Number(userId) },
    data: updateData,
  });
};