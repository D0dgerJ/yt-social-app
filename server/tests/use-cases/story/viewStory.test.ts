import { PrismaClient } from '@prisma/client';
import { viewStory } from '../../../application/use-cases/story/viewStory';

const prisma = new PrismaClient();

describe('viewStory use-case', () => {
  let user: any;
  let story: any;

  beforeEach(async () => {
    await prisma.storyView.deleteMany();
    await prisma.story.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'viewer@example.com',
        username: 'viewer',
        password: '123456',
      },
    });

    story = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: 'https://cdn/image.jpg',
        mediaType: 'image',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a new story view if not viewed before', async () => {
    await viewStory({ userId: user.id, storyId: story.id });

    const view = await prisma.storyView.findUnique({
      where: {
        userId_storyId: {
          userId: user.id,
          storyId: story.id,
        },
      },
    });

    expect(view).not.toBeNull();
    expect(view?.userId).toBe(user.id);
    expect(view?.storyId).toBe(story.id);
  });

  it('should not create a duplicate view', async () => {
    await viewStory({ userId: user.id, storyId: story.id });
    await viewStory({ userId: user.id, storyId: story.id });

    const views = await prisma.storyView.findMany({
      where: {
        userId: user.id,
        storyId: story.id,
      },
    });

    expect(views.length).toBe(1);
  });
});
