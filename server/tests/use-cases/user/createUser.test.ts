import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';

const prisma = new PrismaClient();

describe('createUser use-case', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a new user successfully', async () => {
    const user = await createUser({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'securepass123',
    });

    expect(user).toHaveProperty('id');
    expect(user.email).toBe('newuser@example.com');
    expect(user.username).toBe('newuser');
    expect(user.password).toBe('securepass123');
  });

  it('should create a user with optional fields', async () => {
    const user = await createUser({
      username: 'optionaluser',
      email: 'optional@example.com',
      password: '123456',
      profilePicture: 'http://cdn/image.jpg',
      coverPicture: 'http://cdn/cover.jpg',
      from: 'Mars',
      city: 'New Mars City',
      relationship: 2,
    });

    expect(user.profilePicture).toBe('http://cdn/image.jpg');
    expect(user.city).toBe('New Mars City');
  });

  it('should throw an error if email is not unique', async () => {
    await createUser({
      username: 'user1',
      email: 'duplicate@example.com',
      password: 'pass123',
    });

    await expect(
      createUser({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'pass123',
      })
    ).rejects.toThrow();
  });

  it('should throw an error if username is not unique', async () => {
    await createUser({
      username: 'duplicateuser',
      email: 'unique@example.com',
      password: 'pass123',
    });

    await expect(
      createUser({
        username: 'duplicateuser',
        email: 'another@example.com',
        password: 'pass123',
      })
    ).rejects.toThrow();
  });
});
