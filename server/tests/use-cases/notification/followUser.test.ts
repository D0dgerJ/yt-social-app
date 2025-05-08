import { PrismaClient } from '@prisma/client';
import { followUser } from '../../../application/use-cases/notification/followUser';

const prisma = new PrismaClient();

describe('followUser use-case', () => {
  let follower: any;
  let following: any;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    follower = await prisma.user.create({
      data: { email: 'follower@example.com', username: 'follower', password: '123456' },
    });

    following = await prisma.user.create({
      data: { email: 'following@example.com', username: 'following', password: '123456' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should allow a user to follow another user', async () => {
    const follow = await followUser({
      followerId: follower.id,
      followingId: following.id,
    });

    expect(follow).toHaveProperty('id');
    expect(follow.followerId).toBe(follower.id);
    expect(follow.followingId).toBe(following.id);
  });

  it('should throw an error if already following', async () => {
    await followUser({
      followerId: follower.id,
      followingId: following.id,
    });

    await expect(
      followUser({
        followerId: follower.id,
        followingId: following.id,
      })
    ).rejects.toThrow();
  });

  it('should throw if required fields are missing', async () => {
    await expect(
      // @ts-expect-error
      followUser({ followerId: follower.id })
    ).rejects.toThrow();

    await expect(
      // @ts-expect-error
      followUser({ followingId: following.id })
    ).rejects.toThrow();
  });
});
