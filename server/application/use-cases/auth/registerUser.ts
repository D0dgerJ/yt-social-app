import prisma from '../../../infrastructure/database/prismaClient.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export const registerUser = async ({ username, email, password }: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  return {
    id: newUser.id,
    username: newUser.username,
    email: newUser.email,
    token,
    isAdmin: newUser.isAdmin,
    role: newUser.role,
  };
};