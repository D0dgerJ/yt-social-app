import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';
import { updateUser } from '../../../application/use-cases/user/updateUser';

const prisma = new PrismaClient();

describe('updateUser use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.user.deleteMany();

    user = await createUser({
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
      city: 'Old City',
      from: 'Old Country',
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should update email and city of the user', async () => {
    const updated = await updateUser({
      userId: user.id,
      data: {
        email: 'new@example.com',
        city: 'New City',
      },
    });

    expect(updated.email).toBe('new@example.com');
    expect(updated.city).toBe('New City');
    expect(updated.username).toBe('testuser'); // осталась прежней
  });

  it('should throw an error if user does not exist', async () => {
    await expect(
      updateUser({
        userId: 999999,
        data: { city: 'Nowhere' },
      })
    ).rejects.toThrow();
  });

  it('should update relationship and coverPicture', async () => {
    const updated = await updateUser({
      userId: user.id,
      data: {
        relationship: 2,
        coverPicture: 'https://example.com/cover.jpg',
      },
    });

    expect(updated.relationship).toBe(2);
    expect(updated.coverPicture).toBe('https://example.com/cover.jpg');
  });
});
