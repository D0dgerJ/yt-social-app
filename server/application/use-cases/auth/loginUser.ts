import prisma from '../../../infrastructure/database/prismaClient.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface LoginInput {
  email: string;
  password: string;
}

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    token,
    role: user.role,
  };
};