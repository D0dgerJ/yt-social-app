import prisma from "../../../infrastructure/database/prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";

interface LoginInput {
  email: string;
  password: string;
}

const INVALID_LOGIN_MESSAGE = "Invalid email or password";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;

export const loginUser = async ({ email, password }: LoginInput) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error(INVALID_LOGIN_MESSAGE);
  }

  const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    token,
    role: user.role,
  };
};