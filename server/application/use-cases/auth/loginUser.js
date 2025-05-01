import prisma from "../../../infrastructure/database/prismaClient.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
    },
  };
};