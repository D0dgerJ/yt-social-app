import { PrismaClient } from '@prisma/client';
import { createUser } from '../../../application/use-cases/user/createUser';
import { followUser } from '../../../application/use-cases/user/followUser';
import { unfollowUser } from '../../../application/use-cases/user/unfollowUser';

const prisma = new PrismaClient();

describe('unfollowUser use-case', () => {
  let follower: any;
  let following: any;

  beforeEach(async () => {
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    follower = await createUser({
      username: 'follower',
      email: 'follower@example.com',
      password: 'pass',
    });

    following = await createUser({
      username: 'following',
      email: 'following@example.com',
      password: 'pass',
    });

    await followUser({
      followerId: follower.id,
      followingId: following.id,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should remove a follow relationship', async () => {
    const result = await unfollowUser({
      followerId: follower.id,
      followingId: following.id,
    });

    expect(result.count).toBe(1);

    const check = await prisma.follow.findFirst({
      where: {
        followerId: follower.id,
        followingId: following.id,
      },
    });

    expect(check).toBeNull();
  });

  it('should do nothing if no relationship exists', async () => {
    // Удалим заранее
    await prisma.follow.deleteMany();

    const result = await unfollowUser({
      followerId: follower.id,
      followingId: following.id,
    });

    expect(result.count).toBe(0);
  });
});
