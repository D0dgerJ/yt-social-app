import { registerUser } from '../../../application/use-cases/auth/registerUser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('registerUser use-case', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('registers a new user successfully', async () => {
    const result = await registerUser({
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
    });

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email', 'new@example.com');
    expect(result).toHaveProperty('username', 'newuser');
    expect(result).toHaveProperty('token');
  });

  it('throws if user with email already exists', async () => {
    await registerUser({
      username: 'existinguser',
      email: 'exists@example.com',
      password: 'password123',
    });

    await expect(
      registerUser({
        username: 'duplicate',
        email: 'exists@example.com',
        password: 'password123',
      })
    ).rejects.toThrow('User already exists');
  });
});
