import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';
import { getUserProfile } from '../../../application/use-cases/user/getUserProfile';

const prisma = new PrismaClient();

describe('getUserProfile use-case', () => {
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

  it('should return user profile by ID', async () => {
    const profile = await getUserProfile(user.id);

    expect(profile).not.toBeNull();
    expect(profile?.id).toBe(user.id);
    expect(profile?.username).toBe('testuser');
  });

  it('should return null for non-existent user ID', async () => {
    const profile = await getUserProfile(999999);
    expect(profile).toBeNull();
  });
});
