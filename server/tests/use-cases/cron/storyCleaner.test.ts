import { PrismaClient } from '@prisma/client';
import { cleanExpiredStories } from '../../../cron/storyCleaner';

const prisma = new PrismaClient();

describe('cleanExpiredStories use-case', () => {
  let validStory: any;
  let expiredStory: any;

  beforeEach(async () => {
    await prisma.storyView.deleteMany(); // если у тебя есть зависимости
    await prisma.story.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: 'pass',
      },
    });

    validStory = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: 'media.jpg',
        mediaType: 'image',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // valid for 1h
      },
    });

    expiredStory = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: 'expired.jpg',
        mediaType: 'image',
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // expired 1h ago
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete only expired stories', async () => {
    await cleanExpiredStories();

    const remainingStories = await prisma.story.findMany();
    expect(remainingStories.length).toBe(1);
    expect(remainingStories[0].id).toBe(validStory.id);
  });
});
