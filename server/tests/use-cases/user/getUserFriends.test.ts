import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';
import { followUser } from '../../../application/use-cases/user/followUser';
import { getUserFriends } from '../../../application/use-cases/user/getUserFriends';

const prisma = new PrismaClient();

describe('getUserFriends use-case', () => {
  let user: any;
  let friend1: any;
  let friend2: any;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    user = await createUser({
      username: 'mainUser',
      email: 'main@example.com',
      password: '123456',
    });

    friend1 = await createUser({
      username: 'friend1',
      email: 'f1@example.com',
      password: '123456',
    });

    friend2 = await createUser({
      username: 'friend2',
      email: 'f2@example.com',
      password: '123456',
    });

    await followUser({ followerId: user.id, followingId: friend1.id });
    await followUser({ followerId: user.id, followingId: friend2.id });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return a list of followed users', async () => {
    const friends = await getUserFriends(user.id);

    expect(Array.isArray(friends)).toBe(true);
    expect(friends.length).toBe(2);
    expect(friends[0]).toHaveProperty('following');
    expect(friends[1]).toHaveProperty('following');
  });

  it('should return an empty array if user follows no one', async () => {
    const newUser = await createUser({
      username: 'loner',
      email: 'loner@example.com',
      password: '123456',
    });

    const result = await getUserFriends(newUser.id);
    expect(result).toEqual([]);
  });
});
