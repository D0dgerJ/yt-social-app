import prisma from "../../../infrastructure/database/prismaClient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env.js";

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_MIN_LENGTH = 3;
const PASSWORD_MIN_LENGTH = 6;

export const registerUser = async ({ username, email, password }: RegisterInput) => {
  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw new Error("Invalid email");
  }

  if (normalizedUsername.length < USERNAME_MIN_LENGTH) {
    throw new Error(`Username must be at least ${USERNAME_MIN_LENGTH} characters`);
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: normalizedEmail },
        { username: normalizedUsername },
      ],
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username: normalizedUsername,
      email: normalizedEmail,
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