import prisma from "../../../infrastructure/database/prismaClient.js";
import bcrypt from "bcrypt";

export const createUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });

  return user;
};