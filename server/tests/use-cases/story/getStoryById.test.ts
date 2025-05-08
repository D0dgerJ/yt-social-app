import { PrismaClient } from '@prisma/client';
import { getStoryById } from '../../../application/use-cases/story/getStoryById';

const prisma = new PrismaClient();

describe('getStoryById use-case', () => {
  let user: any;
  let story: any;

  beforeEach(async () => {
    await prisma.storyView.deleteMany();
    await prisma.story.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: 'pass',
      },
    });

    story = await prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: 'https://cdn/story.jpg',
        mediaType: 'image',
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should return a story by ID including user and views', async () => {
    const result = await getStoryById(story.id);

    expect(result).toBeTruthy();
    expect(result?.id).toBe(story.id);
    expect(result?.user).toBeTruthy();
    expect(result?.views).toBeInstanceOf(Array);
  });

  it('should return null if story does not exist', async () => {
    const result = await getStoryById(999999);
    expect(result).toBeNull();
  });
});
