import { loginUser } from '../../../application/use-cases/auth/loginUser';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('loginUser use-case', () => {
  beforeAll(async () => {
    const hashed = await bcrypt.hash('123456', 10);

    await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: hashed,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('throws if email is empty', async () => {
    await expect(loginUser({ email: '', password: '123456' })).rejects.toThrow();
  });

  it('throws if password is empty', async () => {
    await expect(loginUser({ email: 'test@example.com', password: '' })).rejects.toThrow();
  });

  it('throws if password is incorrect', async () => {
    await expect(loginUser({ email: 'test@example.com', password: 'wrongpass' })).rejects.toThrow('Invalid credentials');
  });

  it('logs in successfully with correct credentials', async () => {
    const result = await loginUser({ email: 'test@example.com', password: '123456' });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email', 'test@example.com');
    expect(result).toHaveProperty('username', 'testuser');
    expect(result).toHaveProperty('token');
  });
});
