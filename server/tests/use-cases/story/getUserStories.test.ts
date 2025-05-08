import { PrismaClient } from '@prisma/client';
import { getUserStories } from '../../../application/use-cases/story/getUserStories';

const prisma = new PrismaClient();

describe('getUserStories use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.storyView.deleteMany();
    await prisma.story.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'storyuser@example.com',
        username: 'storyuser',
        password: 'password',
      },
    });

    await prisma.story.createMany({
      data: [
        {
          userId: user.id,
          mediaUrl: 'https://cdn/image1.jpg',
          mediaType: 'image',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: user.id,
          mediaUrl: 'https://cdn/image2.jpg',
          mediaType: 'image',
          expiresAt: new Date(Date.now() + 7200000),
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return all active stories for the user with views included', async () => {
    const stories = await getUserStories(user.id);

    expect(Array.isArray(stories)).toBe(true);
    expect(stories.length).toBe(2);
    expect(stories[0]).toHaveProperty('views');
  });

  it('should return empty array if user has no stories', async () => {
    const newUser = await prisma.user.create({
      data: {
        email: 'empty@example.com',
        username: 'emptyuser',
        password: 'pass',
      },
    });

    const stories = await getUserStories(newUser.id);
    expect(stories).toEqual([]);
  });
});
