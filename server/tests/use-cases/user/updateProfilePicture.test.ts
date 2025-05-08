import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';
import { updateProfilePicture } from '../../../application/use-cases/user/updateProfilePicture';

const prisma = new PrismaClient();

describe('updateProfilePicture use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.user.deleteMany();

    user = await createUser({
      username: 'avatarUser',
      email: 'avatar@example.com',
      password: 'pass123',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should update the user\'s profile picture', async () => {
    const updated = await updateProfilePicture({
      userId: user.id,
      profilePicture: 'https://example.com/avatar.png',
    });

    expect(updated).toHaveProperty('id', user.id);
    expect(updated.profilePicture).toBe('https://example.com/avatar.png');
  });

  it('should throw an error if user does not exist', async () => {
    await expect(
      updateProfilePicture({
        userId: 999999,
        profilePicture: 'https://example.com/fail.png',
      })
    ).rejects.toThrow();
  });
});
