import { PrismaClient } from '@prisma/client';
import { getFeedStories } from '../../../application/use-cases/story/getFeedStories';

const prisma = new PrismaClient();

describe('getFeedStories use-case', () => {
  let follower: any;
  let followed: any;

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

    followed = await prisma.user.create({
      data: {
        email: 'followed@example.com',
        username: 'followed',
        password: '123456',
      },
    });

    await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: followed.id,
      },
    });

    await prisma.story.create({
      data: {
        userId: followed.id,
        mediaUrl: 'https://cdn/story.jpg',
        mediaType: 'image',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return stories from followed users', async () => {
    const stories = await getFeedStories(follower.id);

    expect(Array.isArray(stories)).toBe(true);
    expect(stories.length).toBe(1);
    expect(stories[0]).toHaveProperty('user');
    expect(stories[0]).toHaveProperty('views');
  });

  it('should return empty array if user follows no one', async () => {
    const newUser = await prisma.user.create({
      data: {
        email: 'none@example.com',
        username: 'none',
        password: '123456',
      },
    });

    const stories = await getFeedStories(newUser.id);
    expect(stories).toEqual([]);
  });

  it('should not return expired stories', async () => {
    await prisma.story.create({
      data: {
        userId: followed.id,
        mediaUrl: 'https://cdn/expired.jpg',
        mediaType: 'image',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000),
        expiresAt: new Date(Date.now() - 3600 * 1000),
      },
    });

    const stories = await getFeedStories(follower.id);
    expect(stories.every(s => s.expiresAt > new Date())).toBe(true);
  });
});
