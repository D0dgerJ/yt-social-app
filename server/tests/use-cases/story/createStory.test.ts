import { PrismaClient } from '@prisma/client';
import { createStory } from '../../../application/use-cases/story/createStory';

const prisma = new PrismaClient();

describe('createStory use-case', () => {
  let user: any;

  beforeEach(async () => {
    await prisma.story.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'storyuser@example.com',
        username: 'storyuser',
        password: '123456',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a story for a user', async () => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

    const story = await createStory({
      userId: user.id,
      mediaUrl: 'http://cdn.example.com/image.jpg',
      mediaType: 'image',
      expiresAt,
    });

    expect(story).toHaveProperty('id');
    expect(story.userId).toBe(user.id);
    expect(story.mediaUrl).toBe('http://cdn.example.com/image.jpg');
    expect(story.mediaType).toBe('image');
    expect(new Date(story.expiresAt).getTime()).toBeCloseTo(expiresAt.getTime(), -2);
  });

  it('should throw if required fields are missing', async () => {
    // @ts-expect-error
    await expect(createStory({})).rejects.toThrow();
  });
});
