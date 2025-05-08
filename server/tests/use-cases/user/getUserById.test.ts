import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';
import { getUserById } from '../../../application/use-cases/user/getUserById';

const prisma = new PrismaClient();

describe('getUserById use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.user.deleteMany();

    user = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return a user by ID', async () => {
    const found = await getUserById(user.id);

    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.username).toBe('testuser');
  });

  it('should return null if user not found', async () => {
    const result = await getUserById(999999);
    expect(result).toBeNull();
  });
});
