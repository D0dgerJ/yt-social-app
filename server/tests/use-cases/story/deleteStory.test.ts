import { PrismaClient } from '@prisma/client';
import { deleteStory } from '../../../application/use-cases/story/deleteStory';
import { createStory } from '../../../application/use-cases/story/createStory';

const prisma = new PrismaClient();

describe('deleteStory use-case', () => {
  let user: any;
  let story: any;

  beforeEach(async () => {
    await prisma.story.deleteMany();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        email: 'delete@example.com',
        username: 'deleter',
        password: 'secret',
      },
    });

    story = await createStory({
      userId: user.id,
      mediaUrl: 'http://cdn/story.jpg',
      mediaType: 'image',
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should delete a story by ID', async () => {
    await deleteStory(story.id);

    const deleted = await prisma.story.findUnique({ where: { id: story.id } });
    expect(deleted).toBeNull();
  });

  it('should throw an error if the story does not exist', async () => {
    await prisma.story.delete({ where: { id: story.id } });

    await expect(deleteStory(story.id)).rejects.toThrow();
  });
});
