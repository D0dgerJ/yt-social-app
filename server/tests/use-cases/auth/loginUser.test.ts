import { describe, it, expect } from '@jest/globals';
import { loginUser } from '../../../application/use-cases/auth/loginUser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('loginUser use-case', () => {
  it('should return a token for valid credentials', async () => {
    const user = await prisma.user.create({
      data: {
        username: 'loginuser',
        email: 'login@example.com',
        password: '123456', // если без хеширования
      },
    });

    const result = await loginUser({ email: 'login@example.com', password: '123456' });

    expect(result).toHaveProperty('token');
  });
});
