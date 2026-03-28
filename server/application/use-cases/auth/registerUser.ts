import prisma from "../../../infrastructure/database/prismaClient.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.ts";

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export const registerUser = async ({ username, email, password }: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  const token = jwt.sign({ userId: newUser.id }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    token,
    role: newUser.role,
  };
};