import { PrismaClient } from '@prisma/client';
import { getFriendStories } from '../../../application/use-cases/story/getFriendStories';

const prisma = new PrismaClient();

describe('getFriendStories use-case', () => {
  let follower: any;
  let friend: any;

  beforeEach(async () => {
    await prisma.storyView.deleteMany();
    await prisma.story.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.user.deleteMany();

    follower = await prisma.user.create({
      data: {
        email: 'follower@example.com',
        username: 'follower',
        password: '123456',
      },
    });

    friend = await prisma.user.create({
      data: {
        email: 'friend@example.com',
        username: 'friend',
        password: '123456',
      },
    });

    await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: friend.id,
      },
    });

    await prisma.story.create({
      data: {
        userId: friend.id,
        mediaUrl: 'https://cdn/story.jpg',
        mediaType: 'image',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 час вперёд
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return stories from friends', async () => {
    const stories = await getFriendStories(follower.id);

    expect(Array.isArray(stories)).toBe(true);
    expect(stories.length).toBeGreaterThan(0);
    expect(stories[0]).toHaveProperty('user');
    expect(stories[0].user.id).toBe(friend.id);
  });

  it('should return empty array if user follows no one', async () => {
    const loneUser = await prisma.user.create({
      data: {
        email: 'loner@example.com',
        username: 'loner',
        password: '123456',
      },
    });

    const stories = await getFriendStories(loneUser.id);
    expect(stories).toEqual([]);
  });

  it('should not return expired stories', async () => {
    await prisma.story.create({
      data: {
        userId: friend.id,
        mediaUrl: 'https://cdn/expired.jpg',
        mediaType: 'image',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    });

    const stories = await getFriendStories(follower.id);
    expect(stories.every(s => s.expiresAt > new Date())).toBe(true);
  });
});
